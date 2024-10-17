import {
  __export
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/core.js
var core_exports = {};
__export(core_exports, {
  Channel: () => Channel,
  PluginListener: () => PluginListener,
  Resource: () => Resource,
  addPluginListener: () => addPluginListener,
  checkPermissions: () => checkPermissions,
  convertFileSrc: () => convertFileSrc,
  invoke: () => invoke,
  isTauri: () => isTauri,
  requestPermissions: () => requestPermissions,
  transformCallback: () => transformCallback
});

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/external/tslib/tslib.es6.js
function __classPrivateFieldGet(receiver, state, kind, f) {
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
  return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
}
function __classPrivateFieldSet(receiver, state, value, kind, f) {
  if (kind === "m") throw new TypeError("Private method is not writable");
  if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a setter");
  if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot write private member to an object whose class did not declare it");
  return kind === "a" ? f.call(receiver, value) : f ? f.value = value : state.set(receiver, value), value;
}

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/core.js
var _Channel_onmessage;
var _Channel_nextMessageId;
var _Channel_pendingMessages;
var _Resource_rid;
function transformCallback(callback, once = false) {
  return window.__TAURI_INTERNALS__.transformCallback(callback, once);
}
var Channel = class {
  constructor() {
    this.__TAURI_CHANNEL_MARKER__ = true;
    _Channel_onmessage.set(this, () => {
    });
    _Channel_nextMessageId.set(this, 0);
    _Channel_pendingMessages.set(this, {});
    this.id = transformCallback(({ message, id }) => {
      if (id === __classPrivateFieldGet(this, _Channel_nextMessageId, "f")) {
        __classPrivateFieldSet(this, _Channel_nextMessageId, id + 1, "f");
        __classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message);
        const pendingMessageIds = Object.keys(__classPrivateFieldGet(this, _Channel_pendingMessages, "f"));
        if (pendingMessageIds.length > 0) {
          let nextId = id + 1;
          for (const pendingId of pendingMessageIds.sort()) {
            if (parseInt(pendingId) === nextId) {
              const message2 = __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[pendingId];
              delete __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[pendingId];
              __classPrivateFieldGet(this, _Channel_onmessage, "f").call(this, message2);
              nextId += 1;
            } else {
              break;
            }
          }
          __classPrivateFieldSet(this, _Channel_nextMessageId, nextId, "f");
        }
      } else {
        __classPrivateFieldGet(this, _Channel_pendingMessages, "f")[id.toString()] = message;
      }
    });
  }
  set onmessage(handler) {
    __classPrivateFieldSet(this, _Channel_onmessage, handler, "f");
  }
  get onmessage() {
    return __classPrivateFieldGet(this, _Channel_onmessage, "f");
  }
  toJSON() {
    return `__CHANNEL__:${this.id}`;
  }
};
_Channel_onmessage = /* @__PURE__ */ new WeakMap(), _Channel_nextMessageId = /* @__PURE__ */ new WeakMap(), _Channel_pendingMessages = /* @__PURE__ */ new WeakMap();
var PluginListener = class {
  constructor(plugin, event, channelId) {
    this.plugin = plugin;
    this.event = event;
    this.channelId = channelId;
  }
  async unregister() {
    return invoke(`plugin:${this.plugin}|remove_listener`, {
      event: this.event,
      channelId: this.channelId
    });
  }
};
async function addPluginListener(plugin, event, cb) {
  const handler = new Channel();
  handler.onmessage = cb;
  return invoke(`plugin:${plugin}|register_listener`, { event, handler }).then(() => new PluginListener(plugin, event, handler.id));
}
async function checkPermissions(plugin) {
  return invoke(`plugin:${plugin}|check_permissions`);
}
async function requestPermissions(plugin) {
  return invoke(`plugin:${plugin}|request_permissions`);
}
async function invoke(cmd, args = {}, options) {
  return window.__TAURI_INTERNALS__.invoke(cmd, args, options);
}
function convertFileSrc(filePath, protocol = "asset") {
  return window.__TAURI_INTERNALS__.convertFileSrc(filePath, protocol);
}
var Resource = class {
  get rid() {
    return __classPrivateFieldGet(this, _Resource_rid, "f");
  }
  constructor(rid) {
    _Resource_rid.set(this, void 0);
    __classPrivateFieldSet(this, _Resource_rid, rid, "f");
  }
  /**
   * Destroys and cleans up this resource from memory.
   * **You should not call any method on this object anymore and should drop any reference to it.**
   */
  async close() {
    return invoke("plugin:resources|close", {
      rid: this.rid
    });
  }
};
_Resource_rid = /* @__PURE__ */ new WeakMap();
function isTauri() {
  return "isTauri" in window && !!window.isTauri;
}

export {
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  transformCallback,
  Channel,
  PluginListener,
  addPluginListener,
  checkPermissions,
  requestPermissions,
  invoke,
  convertFileSrc,
  Resource,
  isTauri,
  core_exports
};
//# sourceMappingURL=chunk-NSSZRN4Z.js.map
