type Version = {
  counter: number;
  source: string;
};

type StoredRecord = {
  value: string | null;
  version: Version;
};

type SnapshotMessage = {
  type: "snapshot";
  requestId: string;
  tabId: string;
  instanceId: string;
  clock: number;
  clearVersion: Version | null;
  records: Array<[string, StoredRecord]>;
};

type SnapshotRequestMessage = {
  type: "snapshot-request";
  requestId: string;
  tabId: string;
  instanceId: string;
};

type RecordMessage = {
  type: "record";
  tabId: string;
  instanceId: string;
  key: string;
  record: StoredRecord;
};

type ClearMessage = {
  type: "clear";
  tabId: string;
  instanceId: string;
  version: Version;
};

type StorageMessage =
  | SnapshotMessage
  | SnapshotRequestMessage
  | RecordMessage
  | ClearMessage;

type CrossTabSessionStorageOptions = {
  /**
   * How long a newly loaded window waits for existing tabs to send a snapshot.
   *
   * This only affects startup. Reads and writes are synchronous after `ready`
   * resolves.
   */
  syncTimeoutMs?: number;
};

const documentTabIds = new Map<string, string>();

function createId(): string {
  if (typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `${Date.now().toString(36)}-${Math.random()
    .toString(36)
    .slice(2)}`;
}

function compareVersions(
  left: Version,
  right: Version | null | undefined,
): number {
  if (!right) {
    return 1;
  }

  if (left.counter !== right.counter) {
    return left.counter - right.counter;
  }

  return left.source.localeCompare(right.source);
}

/**
 * Returns an ID representing the current top-level browsing context.
 *
 * On reload, the previous ID is reused. That lets the new document ignore the
 * document that it is replacing, preventing a single-tab reload from restoring
 * its own old state.
 *
 * A newly opened tab receives a new ID, even if its sessionStorage was cloned
 * from window.opener.
 */
function getTabId(namespace: string): string {
  const existingDocumentId = documentTabIds.get(namespace);

  if (existingDocumentId) {
    return existingDocumentId;
  }

  const storageKey = `__cross_tab_session_storage_tab__:${namespace}`;

  let previousId: string | null = null;
  let isReload = false;

  try {
    previousId = window.sessionStorage.getItem(storageKey);

    const navigation = performance.getEntriesByType(
      "navigation",
    )[0] as PerformanceNavigationTiming | undefined;

    isReload = navigation?.type === "reload";
  } catch {
    // sessionStorage or Performance APIs might be unavailable.
  }

  const tabId = isReload && previousId
    ? previousId
    : createId();

  try {
    window.sessionStorage.setItem(storageKey, tabId);
  } catch {
    // Cross-tab synchronization still works, but detecting a same-tab reload
    // will not be possible when sessionStorage is unavailable.
  }

  documentTabIds.set(namespace, tabId);

  return tabId;
}

/**
 * In-memory Storage synchronized between same-origin tabs.
 *
 * Lifecycle:
 * - A newly opened tab restores state from another open tab.
 * - Reloading while another tab is open restores from that other tab.
 * - Reloading the only tab starts empty.
 * - Closing every tab destroys all state.
 * - Opening the application later starts empty.
 */
export class BroadcastStorage implements Storage {
  readonly ready: Promise<void>;

  readonly #tabId: string;
  readonly #instanceId = createId();
  readonly #requestId = createId();
  readonly #channel: BroadcastChannel;

  readonly #records = new Map<string, StoredRecord>();

  #clock = 0;
  #clearVersion: Version | null = null;
  #closed = false;

  constructor(
    namespace: string,
    options: CrossTabSessionStorageOptions = {},
  ) {
    if (typeof window === "undefined") {
      throw new Error(
        "CrossTabSessionStorage can only be constructed in a browser.",
      );
    }

    const { syncTimeoutMs = 100 } = options;

    this.#tabId = getTabId(namespace);
    this.#channel = new BroadcastChannel(
      `cross-tab-session-storage:${namespace}`,
    );

    this.#channel.addEventListener("message", this.#handleMessage);

    this.ready = new Promise<void>((resolve) => {
      this.#requestSnapshot();

      // Send a second request in case another tab was starting concurrently.
      const retryTimer = window.setTimeout(() => {
        this.#requestSnapshot();
      }, Math.floor(syncTimeoutMs / 2));

      window.setTimeout(() => {
        window.clearTimeout(retryTimer);
        resolve();
      }, syncTimeoutMs);
    });
  }

  get length(): number {
    return this.entries().length;
  }

  clear(): void {
    const version = this.#nextVersion();

    this.#applyClear(version);

    this.#postMessage({
      type: "clear",
      tabId: this.#tabId,
      instanceId: this.#instanceId,
      version,
    });
  }

  getItem(key: string): string | null {
    const record = this.#records.get(String(key));

    return record?.value ?? null;
  }

  key(index: number): string | null {
    if (!Number.isInteger(index) || index < 0) {
      return null;
    }

    return this.entries()[index]?.[0] ?? null;
  }

  removeItem(key: string): void {
    const normalizedKey = String(key);

    const record: StoredRecord = {
      value: null,
      version: this.#nextVersion(),
    };

    this.#applyRecord(normalizedKey, record);

    this.#postMessage({
      type: "record",
      tabId: this.#tabId,
      instanceId: this.#instanceId,
      key: normalizedKey,
      record,
    });
  }

  setItem(key: string, value: string): void {
    const normalizedKey = String(key);

    const record: StoredRecord = {
      value: String(value),
      version: this.#nextVersion(),
    };

    this.#applyRecord(normalizedKey, record);

    this.#postMessage({
      type: "record",
      tabId: this.#tabId,
      instanceId: this.#instanceId,
      key: normalizedKey,
      record,
    });
  }

  /**
   * Used by experimental_createQueryPersister utilities such as:
   * - persisterGc()
   * - restoreQueries()
   * - removeQueries()
   */
  entries(): Array<[string, string]> {
    const entries: Array<[string, string]> = [];

    for (const [key, record] of this.#records) {
      if (record.value !== null) {
        entries.push([key, record.value]);
      }
    }

    return entries;
  }

  /**
   * Optional explicit cleanup. The browser also destroys the channel and
   * in-memory records when the document closes.
   */
  close(): void {
    if (this.#closed) {
      return;
    }

    this.#closed = true;
    this.#channel.removeEventListener(
      "message",
      this.#handleMessage,
    );
    this.#channel.close();
    this.#records.clear();
  }

  #requestSnapshot(): void {
    this.#postMessage({
      type: "snapshot-request",
      requestId: this.#requestId,
      tabId: this.#tabId,
      instanceId: this.#instanceId,
    });
  }

  #nextVersion(): Version {
    this.#clock += 1;

    return {
      counter: this.#clock,
      source: this.#instanceId,
    };
  }

  #observeVersion(version: Version): void {
    this.#clock = Math.max(this.#clock, version.counter);
  }

  #applyRecord(key: string, incoming: StoredRecord): void {
    this.#observeVersion(incoming.version);

    if (
      this.#clearVersion &&
      compareVersions(incoming.version, this.#clearVersion) <= 0
    ) {
      return;
    }

    const current = this.#records.get(key);

    if (
      !current ||
      compareVersions(incoming.version, current.version) > 0
    ) {
      this.#records.set(key, incoming);
    }
  }

  #applyClear(version: Version): void {
    this.#observeVersion(version);

    if (
      this.#clearVersion &&
      compareVersions(version, this.#clearVersion) <= 0
    ) {
      return;
    }

    this.#clearVersion = version;

    for (const [key, record] of this.#records) {
      if (compareVersions(record.version, version) <= 0) {
        this.#records.delete(key);
      }
    }
  }

  #postMessage(message: StorageMessage): void {
    if (!this.#closed) {
      this.#channel.postMessage(message);
    }
  }

  #handleMessage = (
    event: MessageEvent<StorageMessage>,
  ): void => {
    const message = event.data;

    if (!message || typeof message !== "object") {
      return;
    }

    /*
     * Ignore the previous document during a reload.
     *
     * Other tabs have different tabIds, so they can still provide the state.
     */
    if (message.tabId === this.#tabId) {
      return;
    }

    switch (message.type) {
      case "snapshot-request": {
        this.#postMessage({
          type: "snapshot",
          requestId: message.requestId,
          tabId: this.#tabId,
          instanceId: this.#instanceId,
          clock: this.#clock,
          clearVersion: this.#clearVersion,
          records: Array.from(this.#records.entries()),
        });

        break;
      }

      case "snapshot": {
        if (message.requestId !== this.#requestId) {
          return;
        }

        this.#clock = Math.max(this.#clock, message.clock);

        if (message.clearVersion) {
          this.#applyClear(message.clearVersion);
        }

        for (const [key, record] of message.records) {
          this.#applyRecord(key, record);
        }

        break;
      }

      case "record": {
        this.#applyRecord(message.key, message.record);
        break;
      }

      case "clear": {
        this.#applyClear(message.version);
        break;
      }
    }
  };
}
