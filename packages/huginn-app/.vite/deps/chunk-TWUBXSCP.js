import {
  Image
} from "./chunk-UHOZUUSD.js";
import {
  invoke
} from "./chunk-NSSZRN4Z.js";
import {
  __export
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/app.js
var app_exports = {};
__export(app_exports, {
  defaultWindowIcon: () => defaultWindowIcon,
  getName: () => getName,
  getTauriVersion: () => getTauriVersion,
  getVersion: () => getVersion,
  hide: () => hide,
  setTheme: () => setTheme,
  show: () => show
});
async function getVersion() {
  return invoke("plugin:app|version");
}
async function getName() {
  return invoke("plugin:app|name");
}
async function getTauriVersion() {
  return invoke("plugin:app|tauri_version");
}
async function show() {
  return invoke("plugin:app|app_show");
}
async function hide() {
  return invoke("plugin:app|app_hide");
}
async function defaultWindowIcon() {
  return invoke("plugin:app|default_window_icon").then((rid) => rid ? new Image(rid) : null);
}
async function setTheme(theme) {
  return invoke("plugin:app|set_app_theme", { theme });
}

export {
  getVersion,
  getName,
  getTauriVersion,
  show,
  hide,
  defaultWindowIcon,
  setTheme,
  app_exports
};
//# sourceMappingURL=chunk-TWUBXSCP.js.map
