import {
  path_exports
} from "./chunk-ZNFAJ4U2.js";
import {
  PhysicalPosition,
  PhysicalSize,
  dpi_exports,
  webviewWindow_exports,
  webview_exports,
  window_exports
} from "./chunk-LJIGNK2J.js";
import {
  event_exports
} from "./chunk-JTSWCEAK.js";
import {
  app_exports
} from "./chunk-TWUBXSCP.js";
import {
  image_exports,
  transformImage
} from "./chunk-UHOZUUSD.js";
import {
  Channel,
  Resource,
  __classPrivateFieldGet,
  __classPrivateFieldSet,
  core_exports,
  invoke
} from "./chunk-NSSZRN4Z.js";
import {
  __export
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu.js
var menu_exports = {};
__export(menu_exports, {
  CheckMenuItem: () => CheckMenuItem,
  IconMenuItem: () => IconMenuItem,
  Menu: () => Menu,
  MenuItem: () => MenuItem,
  NativeIcon: () => NativeIcon,
  PredefinedMenuItem: () => PredefinedMenuItem,
  Submenu: () => Submenu
});

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/base.js
var _MenuItemBase_id;
var _MenuItemBase_kind;
function injectChannel(i) {
  var _a;
  if ("items" in i) {
    i.items = (_a = i.items) === null || _a === void 0 ? void 0 : _a.map((item) => "rid" in item ? item : injectChannel(item));
  } else if ("action" in i && i.action) {
    const handler = new Channel();
    handler.onmessage = i.action;
    delete i.action;
    return { ...i, handler };
  }
  return i;
}
async function newMenu(kind, opts) {
  const handler = new Channel();
  let items = null;
  if (opts && typeof opts === "object") {
    if ("action" in opts && opts.action) {
      handler.onmessage = opts.action;
      delete opts.action;
    }
    if ("items" in opts && opts.items) {
      items = opts.items.map((i) => {
        var _a;
        if ("rid" in i) {
          return [i.rid, i.kind];
        }
        if ("item" in i && typeof i.item === "object" && ((_a = i.item.About) === null || _a === void 0 ? void 0 : _a.icon)) {
          i.item.About.icon = transformImage(i.item.About.icon);
        }
        if ("icon" in i && i.icon) {
          i.icon = transformImage(i.icon);
        }
        return injectChannel(i);
      });
    }
  }
  return invoke("plugin:menu|new", {
    kind,
    options: opts ? { ...opts, items } : void 0,
    handler
  });
}
var MenuItemBase = class extends Resource {
  /** The id of this item. */
  get id() {
    return __classPrivateFieldGet(this, _MenuItemBase_id, "f");
  }
  /** @ignore */
  get kind() {
    return __classPrivateFieldGet(this, _MenuItemBase_kind, "f");
  }
  /** @ignore */
  constructor(rid, id, kind) {
    super(rid);
    _MenuItemBase_id.set(this, void 0);
    _MenuItemBase_kind.set(this, void 0);
    __classPrivateFieldSet(this, _MenuItemBase_id, id, "f");
    __classPrivateFieldSet(this, _MenuItemBase_kind, kind, "f");
  }
};
_MenuItemBase_id = /* @__PURE__ */ new WeakMap(), _MenuItemBase_kind = /* @__PURE__ */ new WeakMap();

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/menuItem.js
var MenuItem = class _MenuItem extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "MenuItem");
  }
  /** Create a new menu item. */
  static async new(opts) {
    return newMenu("MenuItem", opts).then(([rid, id]) => new _MenuItem(rid, id));
  }
  /** Returns the text of this menu item. */
  async text() {
    return invoke("plugin:menu|text", { rid: this.rid, kind: this.kind });
  }
  /** Sets the text for this menu item. */
  async setText(text) {
    return invoke("plugin:menu|set_text", {
      rid: this.rid,
      kind: this.kind,
      text
    });
  }
  /** Returns whether this menu item is enabled or not. */
  async isEnabled() {
    return invoke("plugin:menu|is_enabled", { rid: this.rid, kind: this.kind });
  }
  /** Sets whether this menu item is enabled or not. */
  async setEnabled(enabled) {
    return invoke("plugin:menu|set_enabled", {
      rid: this.rid,
      kind: this.kind,
      enabled
    });
  }
  /** Sets the accelerator for this menu item. */
  async setAccelerator(accelerator) {
    return invoke("plugin:menu|set_accelerator", {
      rid: this.rid,
      kind: this.kind,
      accelerator
    });
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/checkMenuItem.js
var CheckMenuItem = class _CheckMenuItem extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "Check");
  }
  /** Create a new check menu item. */
  static async new(opts) {
    return newMenu("Check", opts).then(([rid, id]) => new _CheckMenuItem(rid, id));
  }
  /** Returns the text of this check menu item. */
  async text() {
    return invoke("plugin:menu|text", { rid: this.rid, kind: this.kind });
  }
  /** Sets the text for this check menu item. */
  async setText(text) {
    return invoke("plugin:menu|set_text", {
      rid: this.rid,
      kind: this.kind,
      text
    });
  }
  /** Returns whether this check menu item is enabled or not. */
  async isEnabled() {
    return invoke("plugin:menu|is_enabled", { rid: this.rid, kind: this.kind });
  }
  /** Sets whether this check menu item is enabled or not. */
  async setEnabled(enabled) {
    return invoke("plugin:menu|set_enabled", {
      rid: this.rid,
      kind: this.kind,
      enabled
    });
  }
  /** Sets the accelerator for this check menu item. */
  async setAccelerator(accelerator) {
    return invoke("plugin:menu|set_accelerator", {
      rid: this.rid,
      kind: this.kind,
      accelerator
    });
  }
  /** Returns whether this check menu item is checked or not. */
  async isChecked() {
    return invoke("plugin:menu|is_checked", { rid: this.rid });
  }
  /** Sets whether this check menu item is checked or not. */
  async setChecked(checked) {
    return invoke("plugin:menu|set_checked", {
      rid: this.rid,
      checked
    });
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/iconMenuItem.js
var NativeIcon;
(function(NativeIcon2) {
  NativeIcon2["Add"] = "Add";
  NativeIcon2["Advanced"] = "Advanced";
  NativeIcon2["Bluetooth"] = "Bluetooth";
  NativeIcon2["Bookmarks"] = "Bookmarks";
  NativeIcon2["Caution"] = "Caution";
  NativeIcon2["ColorPanel"] = "ColorPanel";
  NativeIcon2["ColumnView"] = "ColumnView";
  NativeIcon2["Computer"] = "Computer";
  NativeIcon2["EnterFullScreen"] = "EnterFullScreen";
  NativeIcon2["Everyone"] = "Everyone";
  NativeIcon2["ExitFullScreen"] = "ExitFullScreen";
  NativeIcon2["FlowView"] = "FlowView";
  NativeIcon2["Folder"] = "Folder";
  NativeIcon2["FolderBurnable"] = "FolderBurnable";
  NativeIcon2["FolderSmart"] = "FolderSmart";
  NativeIcon2["FollowLinkFreestanding"] = "FollowLinkFreestanding";
  NativeIcon2["FontPanel"] = "FontPanel";
  NativeIcon2["GoLeft"] = "GoLeft";
  NativeIcon2["GoRight"] = "GoRight";
  NativeIcon2["Home"] = "Home";
  NativeIcon2["IChatTheater"] = "IChatTheater";
  NativeIcon2["IconView"] = "IconView";
  NativeIcon2["Info"] = "Info";
  NativeIcon2["InvalidDataFreestanding"] = "InvalidDataFreestanding";
  NativeIcon2["LeftFacingTriangle"] = "LeftFacingTriangle";
  NativeIcon2["ListView"] = "ListView";
  NativeIcon2["LockLocked"] = "LockLocked";
  NativeIcon2["LockUnlocked"] = "LockUnlocked";
  NativeIcon2["MenuMixedState"] = "MenuMixedState";
  NativeIcon2["MenuOnState"] = "MenuOnState";
  NativeIcon2["MobileMe"] = "MobileMe";
  NativeIcon2["MultipleDocuments"] = "MultipleDocuments";
  NativeIcon2["Network"] = "Network";
  NativeIcon2["Path"] = "Path";
  NativeIcon2["PreferencesGeneral"] = "PreferencesGeneral";
  NativeIcon2["QuickLook"] = "QuickLook";
  NativeIcon2["RefreshFreestanding"] = "RefreshFreestanding";
  NativeIcon2["Refresh"] = "Refresh";
  NativeIcon2["Remove"] = "Remove";
  NativeIcon2["RevealFreestanding"] = "RevealFreestanding";
  NativeIcon2["RightFacingTriangle"] = "RightFacingTriangle";
  NativeIcon2["Share"] = "Share";
  NativeIcon2["Slideshow"] = "Slideshow";
  NativeIcon2["SmartBadge"] = "SmartBadge";
  NativeIcon2["StatusAvailable"] = "StatusAvailable";
  NativeIcon2["StatusNone"] = "StatusNone";
  NativeIcon2["StatusPartiallyAvailable"] = "StatusPartiallyAvailable";
  NativeIcon2["StatusUnavailable"] = "StatusUnavailable";
  NativeIcon2["StopProgressFreestanding"] = "StopProgressFreestanding";
  NativeIcon2["StopProgress"] = "StopProgress";
  NativeIcon2["TrashEmpty"] = "TrashEmpty";
  NativeIcon2["TrashFull"] = "TrashFull";
  NativeIcon2["User"] = "User";
  NativeIcon2["UserAccounts"] = "UserAccounts";
  NativeIcon2["UserGroup"] = "UserGroup";
  NativeIcon2["UserGuest"] = "UserGuest";
})(NativeIcon || (NativeIcon = {}));
var IconMenuItem = class _IconMenuItem extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "Icon");
  }
  /** Create a new icon menu item. */
  static async new(opts) {
    return newMenu("Icon", opts).then(([rid, id]) => new _IconMenuItem(rid, id));
  }
  /** Returns the text of this icon menu item. */
  async text() {
    return invoke("plugin:menu|text", { rid: this.rid, kind: this.kind });
  }
  /** Sets the text for this icon menu item. */
  async setText(text) {
    return invoke("plugin:menu|set_text", {
      rid: this.rid,
      kind: this.kind,
      text
    });
  }
  /** Returns whether this icon menu item is enabled or not. */
  async isEnabled() {
    return invoke("plugin:menu|is_enabled", { rid: this.rid, kind: this.kind });
  }
  /** Sets whether this icon menu item is enabled or not. */
  async setEnabled(enabled) {
    return invoke("plugin:menu|set_enabled", {
      rid: this.rid,
      kind: this.kind,
      enabled
    });
  }
  /** Sets the accelerator for this icon menu item. */
  async setAccelerator(accelerator) {
    return invoke("plugin:menu|set_accelerator", {
      rid: this.rid,
      kind: this.kind,
      accelerator
    });
  }
  /** Sets an icon for this icon menu item */
  async setIcon(icon) {
    return invoke("plugin:menu|set_icon", {
      rid: this.rid,
      icon: transformImage(icon)
    });
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/predefinedMenuItem.js
var PredefinedMenuItem = class _PredefinedMenuItem extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "Predefined");
  }
  /** Create a new predefined menu item. */
  static async new(opts) {
    return newMenu("Predefined", opts).then(([rid, id]) => new _PredefinedMenuItem(rid, id));
  }
  /** Returns the text of this predefined menu item. */
  async text() {
    return invoke("plugin:menu|text", { rid: this.rid, kind: this.kind });
  }
  /** Sets the text for this predefined menu item. */
  async setText(text) {
    return invoke("plugin:menu|set_text", {
      rid: this.rid,
      kind: this.kind,
      text
    });
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/submenu.js
function itemFromKind([rid, id, kind]) {
  switch (kind) {
    case "Submenu":
      return new Submenu(rid, id);
    case "Predefined":
      return new PredefinedMenuItem(rid, id);
    case "Check":
      return new CheckMenuItem(rid, id);
    case "Icon":
      return new IconMenuItem(rid, id);
    case "MenuItem":
    default:
      return new MenuItem(rid, id);
  }
}
var Submenu = class _Submenu extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "Submenu");
  }
  /** Create a new submenu. */
  static async new(opts) {
    return newMenu("Submenu", opts).then(([rid, id]) => new _Submenu(rid, id));
  }
  /** Returns the text of this submenu. */
  async text() {
    return invoke("plugin:menu|text", { rid: this.rid, kind: this.kind });
  }
  /** Sets the text for this submenu. */
  async setText(text) {
    return invoke("plugin:menu|set_text", {
      rid: this.rid,
      kind: this.kind,
      text
    });
  }
  /** Returns whether this submenu is enabled or not. */
  async isEnabled() {
    return invoke("plugin:menu|is_enabled", { rid: this.rid, kind: this.kind });
  }
  /** Sets whether this submenu is enabled or not. */
  async setEnabled(enabled) {
    return invoke("plugin:menu|set_enabled", {
      rid: this.rid,
      kind: this.kind,
      enabled
    });
  }
  /**
   * Add a menu item to the end of this submenu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async append(items) {
    return invoke("plugin:menu|append", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i)
    });
  }
  /**
   * Add a menu item to the beginning of this submenu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async prepend(items) {
    return invoke("plugin:menu|prepend", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i)
    });
  }
  /**
   * Add a menu item to the specified position in this submenu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async insert(items, position) {
    return invoke("plugin:menu|insert", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i),
      position
    });
  }
  /** Remove a menu item from this submenu. */
  async remove(item) {
    return invoke("plugin:menu|remove", {
      rid: this.rid,
      kind: this.kind,
      item: [item.rid, item.kind]
    });
  }
  /** Remove a menu item from this submenu at the specified position. */
  async removeAt(position) {
    return invoke("plugin:menu|remove_at", {
      rid: this.rid,
      kind: this.kind,
      position
    }).then(itemFromKind);
  }
  /** Returns a list of menu items that has been added to this submenu. */
  async items() {
    return invoke("plugin:menu|items", {
      rid: this.rid,
      kind: this.kind
    }).then((i) => i.map(itemFromKind));
  }
  /** Retrieves the menu item matching the given identifier. */
  async get(id) {
    return invoke("plugin:menu|get", {
      rid: this.rid,
      kind: this.kind,
      id
    }).then((r) => r ? itemFromKind(r) : null);
  }
  /**
   * Popup this submenu as a context menu on the specified window.
   *
   * If the position, is provided, it is relative to the window's top-left corner.
   */
  async popup(at, window2) {
    var _a;
    let atValue = null;
    if (at) {
      atValue = {};
      atValue[`${at instanceof PhysicalPosition ? "Physical" : "Logical"}`] = {
        x: at.x,
        y: at.y
      };
    }
    return invoke("plugin:menu|popup", {
      rid: this.rid,
      kind: this.kind,
      window: (_a = window2 === null || window2 === void 0 ? void 0 : window2.label) !== null && _a !== void 0 ? _a : null,
      at: atValue
    });
  }
  /**
   * Set this submenu as the Window menu for the application on macOS.
   *
   * This will cause macOS to automatically add window-switching items and
   * certain other items to the menu.
   *
   * #### Platform-specific:
   *
   * - **Windows / Linux**: Unsupported.
   */
  async setAsWindowsMenuForNSApp() {
    return invoke("plugin:menu|set_as_windows_menu_for_nsapp", {
      rid: this.rid
    });
  }
  /**
   * Set this submenu as the Help menu for the application on macOS.
   *
   * This will cause macOS to automatically add a search box to the menu.
   *
   * If no menu is set as the Help menu, macOS will automatically use any menu
   * which has a title matching the localized word "Help".
   *
   * #### Platform-specific:
   *
   * - **Windows / Linux**: Unsupported.
   */
  async setAsHelpMenuForNSApp() {
    return invoke("plugin:menu|set_as_help_menu_for_nsapp", {
      rid: this.rid
    });
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/menu/menu.js
function itemFromKind2([rid, id, kind]) {
  switch (kind) {
    case "Submenu":
      return new Submenu(rid, id);
    case "Predefined":
      return new PredefinedMenuItem(rid, id);
    case "Check":
      return new CheckMenuItem(rid, id);
    case "Icon":
      return new IconMenuItem(rid, id);
    case "MenuItem":
    default:
      return new MenuItem(rid, id);
  }
}
var Menu = class _Menu extends MenuItemBase {
  /** @ignore */
  constructor(rid, id) {
    super(rid, id, "Menu");
  }
  /** Create a new menu. */
  static async new(opts) {
    return newMenu("Menu", opts).then(([rid, id]) => new _Menu(rid, id));
  }
  /** Create a default menu. */
  static async default() {
    return invoke("plugin:menu|create_default").then(([rid, id]) => new _Menu(rid, id));
  }
  /**
   * Add a menu item to the end of this menu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async append(items) {
    return invoke("plugin:menu|append", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i)
    });
  }
  /**
   * Add a menu item to the beginning of this menu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async prepend(items) {
    return invoke("plugin:menu|prepend", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i)
    });
  }
  /**
   * Add a menu item to the specified position in this menu.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Only {@linkcode Submenu}s can be added to a {@linkcode Menu}.
   */
  async insert(items, position) {
    return invoke("plugin:menu|insert", {
      rid: this.rid,
      kind: this.kind,
      items: (Array.isArray(items) ? items : [items]).map((i) => "rid" in i ? [i.rid, i.kind] : i),
      position
    });
  }
  /** Remove a menu item from this menu. */
  async remove(item) {
    return invoke("plugin:menu|remove", {
      rid: this.rid,
      kind: this.kind,
      item: [item.rid, item.kind]
    });
  }
  /** Remove a menu item from this menu at the specified position. */
  async removeAt(position) {
    return invoke("plugin:menu|remove_at", {
      rid: this.rid,
      kind: this.kind,
      position
    }).then(itemFromKind2);
  }
  /** Returns a list of menu items that has been added to this menu. */
  async items() {
    return invoke("plugin:menu|items", {
      rid: this.rid,
      kind: this.kind
    }).then((i) => i.map(itemFromKind2));
  }
  /** Retrieves the menu item matching the given identifier. */
  async get(id) {
    return invoke("plugin:menu|get", {
      rid: this.rid,
      kind: this.kind,
      id
    }).then((r) => r ? itemFromKind2(r) : null);
  }
  /**
   * Popup this menu as a context menu on the specified window.
   *
   * If the position, is provided, it is relative to the window's top-left corner.
   */
  async popup(at, window2) {
    var _a;
    let atValue = null;
    if (at) {
      atValue = {};
      atValue[`${at instanceof PhysicalPosition ? "Physical" : "Logical"}`] = {
        x: at.x,
        y: at.y
      };
    }
    return invoke("plugin:menu|popup", {
      rid: this.rid,
      kind: this.kind,
      window: (_a = window2 === null || window2 === void 0 ? void 0 : window2.label) !== null && _a !== void 0 ? _a : null,
      at: atValue
    });
  }
  /**
   * Sets the app-wide menu and returns the previous one.
   *
   * If a window was not created with an explicit menu or had one set explicitly,
   * this menu will be assigned to it.
   */
  async setAsAppMenu() {
    return invoke("plugin:menu|set_as_app_menu", {
      rid: this.rid
    }).then((r) => r ? new _Menu(r[0], r[1]) : null);
  }
  /**
   * Sets the window menu and returns the previous one.
   *
   * #### Platform-specific:
   *
   * - **macOS:** Unsupported. The menu on macOS is app-wide and not specific to one
   * window, if you need to set it, use {@linkcode Menu.setAsAppMenu} instead.
   */
  async setAsWindowMenu(window2) {
    var _a;
    return invoke("plugin:menu|set_as_window_menu", {
      rid: this.rid,
      window: (_a = window2 === null || window2 === void 0 ? void 0 : window2.label) !== null && _a !== void 0 ? _a : null
    }).then((r) => r ? new _Menu(r[0], r[1]) : null);
  }
};

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/mocks.js
var mocks_exports = {};
__export(mocks_exports, {
  clearMocks: () => clearMocks,
  mockConvertFileSrc: () => mockConvertFileSrc,
  mockIPC: () => mockIPC,
  mockWindows: () => mockWindows
});
function mockInternals() {
  var _a;
  window.__TAURI_INTERNALS__ = (_a = window.__TAURI_INTERNALS__) !== null && _a !== void 0 ? _a : {};
}
function mockIPC(cb) {
  mockInternals();
  window.__TAURI_INTERNALS__.transformCallback = function transformCallback(callback, once = false) {
    const identifier = window.crypto.getRandomValues(new Uint32Array(1))[0];
    const prop = `_${identifier}`;
    Object.defineProperty(window, prop, {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      value: (result) => {
        if (once) {
          Reflect.deleteProperty(window, prop);
        }
        return callback && callback(result);
      },
      writable: false,
      configurable: true
    });
    return identifier;
  };
  window.__TAURI_INTERNALS__.invoke = function(cmd, args, options) {
    return cb(cmd, args);
  };
}
function mockWindows(current, ...additionalWindows) {
  mockInternals();
  window.__TAURI_INTERNALS__.metadata = {
    windows: [current, ...additionalWindows].map((label) => ({ label })),
    currentWindow: { label: current },
    webviews: [current, ...additionalWindows].map((label) => ({
      windowLabel: label,
      label
    })),
    currentWebview: { windowLabel: current, label: current }
  };
}
function mockConvertFileSrc(osName) {
  mockInternals();
  window.__TAURI_INTERNALS__.convertFileSrc = function(filePath, protocol = "asset") {
    const path = encodeURIComponent(filePath);
    return osName === "windows" ? `http://${protocol}.localhost/${path}` : `${protocol}://localhost/${path}`;
  };
}
function clearMocks() {
  var _a, _b, _c;
  if (typeof window.__TAURI_INTERNALS__ !== "object") {
    return;
  }
  if ((_a = window.__TAURI_INTERNALS__) === null || _a === void 0 ? void 0 : _a.convertFileSrc)
    delete window.__TAURI_INTERNALS__.convertFileSrc;
  if ((_b = window.__TAURI_INTERNALS__) === null || _b === void 0 ? void 0 : _b.invoke)
    delete window.__TAURI_INTERNALS__.invoke;
  if ((_c = window.__TAURI_INTERNALS__) === null || _c === void 0 ? void 0 : _c.metadata)
    delete window.__TAURI_INTERNALS__.metadata;
}

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/tray.js
var tray_exports = {};
__export(tray_exports, {
  TrayIcon: () => TrayIcon
});
var TrayIcon = class _TrayIcon extends Resource {
  constructor(rid, id) {
    super(rid);
    this.id = id;
  }
  /** Gets a tray icon using the provided id. */
  static async getById(id) {
    return invoke("plugin:tray|get_by_id", { id }).then((rid) => rid ? new _TrayIcon(rid, id) : null);
  }
  /**
   * Removes a tray icon using the provided id from tauri's internal state.
   *
   * Note that this may cause the tray icon to disappear
   * if it wasn't cloned somewhere else or referenced by JS.
   */
  static async removeById(id) {
    return invoke("plugin:tray|remove_by_id", { id });
  }
  /**
   * Creates a new {@linkcode TrayIcon}
   *
   * #### Platform-specific:
   *
   * - **Linux:** Sometimes the icon won't be visible unless a menu is set.
   * Setting an empty {@linkcode Menu} is enough.
   */
  static async new(options) {
    if (options === null || options === void 0 ? void 0 : options.menu) {
      options.menu = [options.menu.rid, options.menu.kind];
    }
    if (options === null || options === void 0 ? void 0 : options.icon) {
      options.icon = transformImage(options.icon);
    }
    const handler = new Channel();
    if (options === null || options === void 0 ? void 0 : options.action) {
      const action = options.action;
      handler.onmessage = (e) => action(mapEvent(e));
      delete options.action;
    }
    return invoke("plugin:tray|new", {
      options: options !== null && options !== void 0 ? options : {},
      handler
    }).then(([rid, id]) => new _TrayIcon(rid, id));
  }
  /**
   *  Sets a new tray icon. If `null` is provided, it will remove the icon.
   *
   * Note that you need the `image-ico` or `image-png` Cargo features to use this API.
   * To enable it, change your Cargo.toml file:
   * ```toml
   * [dependencies]
   * tauri = { version = "...", features = ["...", "image-png"] }
   * ```
   */
  async setIcon(icon) {
    let trayIcon = null;
    if (icon) {
      trayIcon = transformImage(icon);
    }
    return invoke("plugin:tray|set_icon", { rid: this.rid, icon: trayIcon });
  }
  /**
   * Sets a new tray menu.
   *
   * #### Platform-specific:
   *
   * - **Linux**: once a menu is set it cannot be removed so `null` has no effect
   */
  async setMenu(menu) {
    if (menu) {
      menu = [menu.rid, menu.kind];
    }
    return invoke("plugin:tray|set_menu", { rid: this.rid, menu });
  }
  /**
   * Sets the tooltip for this tray icon.
   *
   * #### Platform-specific:
   *
   * - **Linux:** Unsupported
   */
  async setTooltip(tooltip) {
    return invoke("plugin:tray|set_tooltip", { rid: this.rid, tooltip });
  }
  /**
   * Sets the tooltip for this tray icon.
   *
   * #### Platform-specific:
   *
   * - **Linux:** The title will not be shown unless there is an icon
   * as well.  The title is useful for numerical and other frequently
   * updated information.  In general, it shouldn't be shown unless a
   * user requests it as it can take up a significant amount of space
   * on the user's panel.  This may not be shown in all visualizations.
   * - **Windows:** Unsupported
   */
  async setTitle(title) {
    return invoke("plugin:tray|set_title", { rid: this.rid, title });
  }
  /** Show or hide this tray icon. */
  async setVisible(visible) {
    return invoke("plugin:tray|set_visible", { rid: this.rid, visible });
  }
  /**
   * Sets the tray icon temp dir path. **Linux only**.
   *
   * On Linux, we need to write the icon to the disk and usually it will
   * be `$XDG_RUNTIME_DIR/tray-icon` or `$TEMP/tray-icon`.
   */
  async setTempDirPath(path) {
    return invoke("plugin:tray|set_temp_dir_path", { rid: this.rid, path });
  }
  /** Sets the current icon as a [template](https://developer.apple.com/documentation/appkit/nsimage/1520017-template?language=objc). **macOS only** */
  async setIconAsTemplate(asTemplate) {
    return invoke("plugin:tray|set_icon_as_template", {
      rid: this.rid,
      asTemplate
    });
  }
  /** Disable or enable showing the tray menu on left click. **macOS only**. */
  async setMenuOnLeftClick(onLeft) {
    return invoke("plugin:tray|set_show_menu_on_left_click", {
      rid: this.rid,
      onLeft
    });
  }
};
function mapEvent(e) {
  const out = e;
  out.position = new PhysicalPosition(e.position.x, e.position.y);
  out.rect.position = new PhysicalPosition(e.rect.position.Physical.x, e.rect.position.Physical.y);
  out.rect.size = new PhysicalSize(e.rect.size.Physical.width, e.rect.size.Physical.height);
  return out;
}
export {
  app_exports as app,
  core_exports as core,
  dpi_exports as dpi,
  event_exports as event,
  image_exports as image,
  menu_exports as menu,
  mocks_exports as mocks,
  path_exports as path,
  tray_exports as tray,
  webview_exports as webview,
  webviewWindow_exports as webviewWindow,
  window_exports as window
};
//# sourceMappingURL=@tauri-apps_api.js.map
