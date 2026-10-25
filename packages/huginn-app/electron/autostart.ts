import { app } from "electron";
import fs from "node:fs/promises";
import path from "node:path";

export async function applyAutostartSettings(enabled: boolean) {
   // Development builds must not register the Electron executable at login.
   if (!app.isPackaged) return;

   if (process.platform === "win32" || process.platform === "darwin") {
      app.setLoginItemSettings({ openAtLogin: enabled, path: app.getPath("exe"), args: ["--silent"] });
      return;
   }

   if (process.platform !== "linux") throw new Error("Autostart is unavailable on this platform");

   const directory = path.join(app.getPath("appData"), "autostart");
   const filename = path.join(directory, "dev.huginn.Huginn.desktop");
   if (!enabled) {
      await fs.rm(filename, { force: true });
      return;
   }

   // APPIMAGE points to the persistent launcher rather than its temporary mount.
   const executable = process.env.APPIMAGE || app.getPath("exe");
   if (/[\r\n]/.test(executable)) throw new Error("The application path cannot contain line breaks");
   // Escape both Exec quoting and the desktop entry's string escaping layer.
   const quoted = executable
      .replace(/[\\"`$]/g, "\\$&")
      .replace(/\\/g, "\\\\")
      .replace(/%/g, "%%");
   const content = `[Desktop Entry]\nType=Application\nName=Huginn\nExec="${quoted}" --silent\nTerminal=false\n`;
   await fs.mkdir(directory, { recursive: true });
   await fs.writeFile(filename, content, "utf-8");
}
