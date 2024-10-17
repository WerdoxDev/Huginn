import {
  invoke
} from "./chunk-NSSZRN4Z.js";
import {
  __export
} from "./chunk-RDKGUBC5.js";

// ../../node_modules/.deno/@tauri-apps+api@2.0.2/node_modules/@tauri-apps/api/path.js
var path_exports = {};
__export(path_exports, {
  BaseDirectory: () => BaseDirectory,
  appCacheDir: () => appCacheDir,
  appConfigDir: () => appConfigDir,
  appDataDir: () => appDataDir,
  appLocalDataDir: () => appLocalDataDir,
  appLogDir: () => appLogDir,
  audioDir: () => audioDir,
  basename: () => basename,
  cacheDir: () => cacheDir,
  configDir: () => configDir,
  dataDir: () => dataDir,
  delimiter: () => delimiter,
  desktopDir: () => desktopDir,
  dirname: () => dirname,
  documentDir: () => documentDir,
  downloadDir: () => downloadDir,
  executableDir: () => executableDir,
  extname: () => extname,
  fontDir: () => fontDir,
  homeDir: () => homeDir,
  isAbsolute: () => isAbsolute,
  join: () => join,
  localDataDir: () => localDataDir,
  normalize: () => normalize,
  pictureDir: () => pictureDir,
  publicDir: () => publicDir,
  resolve: () => resolve,
  resolveResource: () => resolveResource,
  resourceDir: () => resourceDir,
  runtimeDir: () => runtimeDir,
  sep: () => sep,
  tempDir: () => tempDir,
  templateDir: () => templateDir,
  videoDir: () => videoDir
});
var BaseDirectory;
(function(BaseDirectory2) {
  BaseDirectory2[BaseDirectory2["Audio"] = 1] = "Audio";
  BaseDirectory2[BaseDirectory2["Cache"] = 2] = "Cache";
  BaseDirectory2[BaseDirectory2["Config"] = 3] = "Config";
  BaseDirectory2[BaseDirectory2["Data"] = 4] = "Data";
  BaseDirectory2[BaseDirectory2["LocalData"] = 5] = "LocalData";
  BaseDirectory2[BaseDirectory2["Document"] = 6] = "Document";
  BaseDirectory2[BaseDirectory2["Download"] = 7] = "Download";
  BaseDirectory2[BaseDirectory2["Picture"] = 8] = "Picture";
  BaseDirectory2[BaseDirectory2["Public"] = 9] = "Public";
  BaseDirectory2[BaseDirectory2["Video"] = 10] = "Video";
  BaseDirectory2[BaseDirectory2["Resource"] = 11] = "Resource";
  BaseDirectory2[BaseDirectory2["Temp"] = 12] = "Temp";
  BaseDirectory2[BaseDirectory2["AppConfig"] = 13] = "AppConfig";
  BaseDirectory2[BaseDirectory2["AppData"] = 14] = "AppData";
  BaseDirectory2[BaseDirectory2["AppLocalData"] = 15] = "AppLocalData";
  BaseDirectory2[BaseDirectory2["AppCache"] = 16] = "AppCache";
  BaseDirectory2[BaseDirectory2["AppLog"] = 17] = "AppLog";
  BaseDirectory2[BaseDirectory2["Desktop"] = 18] = "Desktop";
  BaseDirectory2[BaseDirectory2["Executable"] = 19] = "Executable";
  BaseDirectory2[BaseDirectory2["Font"] = 20] = "Font";
  BaseDirectory2[BaseDirectory2["Home"] = 21] = "Home";
  BaseDirectory2[BaseDirectory2["Runtime"] = 22] = "Runtime";
  BaseDirectory2[BaseDirectory2["Template"] = 23] = "Template";
})(BaseDirectory || (BaseDirectory = {}));
async function appConfigDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.AppConfig
  });
}
async function appDataDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.AppData
  });
}
async function appLocalDataDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.AppLocalData
  });
}
async function appCacheDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.AppCache
  });
}
async function audioDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Audio
  });
}
async function cacheDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Cache
  });
}
async function configDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Config
  });
}
async function dataDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Data
  });
}
async function desktopDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Desktop
  });
}
async function documentDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Document
  });
}
async function downloadDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Download
  });
}
async function executableDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Executable
  });
}
async function fontDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Font
  });
}
async function homeDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Home
  });
}
async function localDataDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.LocalData
  });
}
async function pictureDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Picture
  });
}
async function publicDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Public
  });
}
async function resourceDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Resource
  });
}
async function resolveResource(resourcePath) {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Resource,
    path: resourcePath
  });
}
async function runtimeDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Runtime
  });
}
async function templateDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Template
  });
}
async function videoDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Video
  });
}
async function appLogDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.AppLog
  });
}
async function tempDir() {
  return invoke("plugin:path|resolve_directory", {
    directory: BaseDirectory.Temp
  });
}
function sep() {
  return window.__TAURI_INTERNALS__.plugins.path.sep;
}
function delimiter() {
  return window.__TAURI_INTERNALS__.plugins.path.delimiter;
}
async function resolve(...paths) {
  return invoke("plugin:path|resolve", { paths });
}
async function normalize(path) {
  return invoke("plugin:path|normalize", { path });
}
async function join(...paths) {
  return invoke("plugin:path|join", { paths });
}
async function dirname(path) {
  return invoke("plugin:path|dirname", { path });
}
async function extname(path) {
  return invoke("plugin:path|extname", { path });
}
async function basename(path, ext) {
  return invoke("plugin:path|basename", { path, ext });
}
async function isAbsolute(path) {
  return invoke("plugin:path|isAbsolute", { path });
}

export {
  BaseDirectory,
  appConfigDir,
  appDataDir,
  appLocalDataDir,
  appCacheDir,
  audioDir,
  cacheDir,
  configDir,
  dataDir,
  desktopDir,
  documentDir,
  downloadDir,
  executableDir,
  fontDir,
  homeDir,
  localDataDir,
  pictureDir,
  publicDir,
  resourceDir,
  resolveResource,
  runtimeDir,
  templateDir,
  videoDir,
  appLogDir,
  tempDir,
  sep,
  delimiter,
  resolve,
  normalize,
  join,
  dirname,
  extname,
  basename,
  isAbsolute,
  path_exports
};
//# sourceMappingURL=chunk-ZNFAJ4U2.js.map
