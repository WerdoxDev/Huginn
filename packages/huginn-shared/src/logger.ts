type LogValuesMap = {
   "api:voice": "send" | "recv" | "heartbeat" | "ping" | "default" | "local-voice-state";
   "api:gateway": "send" | "send-detail" | "default" | "recv" | "recv-detail" | "dispatch" | "heartbeat";
   "api:client": "ready-state";
   "app:client-store": "default";
   "app:voice-client": "default" | "voice-recv" | "emitter-recv" | "settings-sub";
   "app:voice-store":
      | "remote-sources"
      | "speaking-state"
      | "voice-state"
      | "call-state"
      | "default"
      | "gateway-recv"
      | "voice-recv"
      | "available-producers";
   "app:general": "messages";
   "app:files-store": "voice-preferences";
   "app:presence-store": "default";
   "app:audio-source-player": "default";
   "app:audio-level-checker": "default";
   "app:voice-input-device": "default";
   "app:electron": "default" | "send" | "recv" | "updater" | "loopback-send" | "loopback";
   "server:gateway": "default" | "send" | "recv" | "heartbeat" | "detail-identify";
   "server:presence-manager": "default" | "send" | "detail";
   "voice:websocket": "default" | "recv";
   "shared:websocket": "default" | "subscriptions";
   "shared:client-session": "default" | "subscriptions" | "heartbeat";
};

// type Logs = typeof logs;
type LogKeys = keyof LogValuesMap;
type LogValuesFor<K extends LogKeys> = LogValuesMap[K];
export type LogArgs = string | number | boolean | null | undefined | unknown;

const enabledLogs = new Map<LogKeys, Set<LogValuesMap[LogKeys]>>();
const excludedEventLogs = new Map<LogKeys, Set<LogValuesMap[LogKeys]>>();

const levelStyles: Partial<Record<LogValuesFor<LogKeys> | "default", string>> = {
   default: "color: green",
   // debug: 'color: white; background: #666; padding: 1px 6px; border-radius: 4px;',
   // warn: 'color: black; background: #FFC107; padding: 1px 6px; border-radius: 4px;',
};

const sectionStyles: Partial<Record<LogKeys | "default" | "error", string>> = {
   default: "color: black; background: white; padding: 1px 6px; border-radius: 4px;",
   error: "color: white; background: #DC3545; padding: 1px 6px; border-radius: 4px;",
   "api:gateway": "color: white; background: #007BFF; padding: 1px 6px; border-radius: 4px;",
   "api:voice": "color: white; background: #029687; padding: 1px 6px; border-radius: 4px;",
};

let onLog: ((section: string, level: string, ...args: LogArgs[]) => void) | undefined;
let onError: ((section: string, ...args: LogArgs[]) => void) | undefined;
let _isRaw = false;

export function enableLogs<T extends Partial<{ [K in LogKeys]: LogValuesMap[K][] }>>(sections: T): void {
   for (const [section, levels] of Object.entries(sections) as [LogKeys, string[]][]) {
      if (enabledLogs.has(section)) {
         const existing = enabledLogs.get(section);
         for (const level of levels) {
            existing?.add(level as LogValuesFor<typeof section>);
         }
      } else {
         enabledLogs.set(section, new Set(levels as LogValuesFor<typeof section>[]));
      }
   }
}

export function excludeEventLogs<T extends Partial<{ [K in LogKeys]: LogValuesMap[K][] }>>(sections: T): void {
   for (const [section, levels] of Object.entries(sections) as [LogKeys, string[]][]) {
      if (excludedEventLogs.has(section)) {
         const existing = excludedEventLogs.get(section);
         for (const level of levels) {
            existing?.add(level as LogValuesFor<typeof section>);
         }
      } else {
         excludedEventLogs.set(section, new Set(levels as LogValuesFor<typeof section>[]));
      }
   }
}

export function disableLogs<K extends LogKeys>(sections: Record<K, LogValuesFor<K>[]>): void {
   for (const entry of Object.entries(sections)) {
      const section = entry[0] as LogKeys;
      const levels = entry[1] as LogValuesFor<K>[];

      if (!enabledLogs.has(section)) {
         return;
      }

      const existingSection = enabledLogs.get(section);
      for (const level of levels) {
         existingSection?.delete(level);
      }

      if (existingSection?.size === 0) {
         enabledLogs.delete(section);
      }
   }
}

export function setIsRaw(isRaw: boolean): void {
   _isRaw = isRaw;
}

export function setOnLog(func: typeof onLog): void {
   onLog = func;
}

export function setOnError(func: typeof onError): void {
   onError = func;
}

export function log<K extends LogKeys>(section: K, level: LogValuesFor<K>, ...args: LogArgs[]): void {
   const excludedSections = excludedEventLogs.get(section);
   if (!excludedSections || !excludedSections.has(level)) {
      onLog?.(section, level, ...args);
   }

   const existingSections = enabledLogs.get(section);
   if (!existingSections || !existingSections.has(level)) {
      return;
   }

   const sectionStyle = sectionStyles[section] ?? sectionStyles.default;
   const levelStyle = levelStyles[level] ?? levelStyles.default;

   const formatString = `%c${section}%c [${level}]`;
   const stylesString = [sectionStyle, levelStyle];

   if (_isRaw) {
      console.log(section, level, ...args);
   } else {
      console.log(formatString, ...stylesString, ...args);
   }
}

export function error(section: LogKeys, ...args: LogArgs[]): void {
   onError?.(section, ...args);

   const levelStyle = levelStyles.default;
   const sectionStyle = sectionStyles[section] ?? sectionStyles.error;

   const formatString = `%c${section}%c [error]`;

   if (_isRaw) {
      console.error(section, ...args);
   } else {
      console.error(formatString, sectionStyle, levelStyle, ...args);
   }
}
