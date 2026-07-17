import * as loopback from "application-loopback";
import { app, dialog } from "electron";
import "dotenv/config";
import path from "node:path";

let allowedToRun: boolean = false;

if (!process.env.VITE_DEV_SERVER_URL) {
   if (process.defaultApp) {
      if (process.argv.length >= 2) {
         const args = process.argv[1];
         app.setAsDefaultProtocolClient("huginn", process.execPath, [path.resolve(args)]);
      }
   } else {
      app.setAsDefaultProtocolClient("huginn");
   }

   allowedToRun = app.requestSingleInstanceLock();

   if (!allowedToRun) {
      app.exit();
   }
} else {
   allowedToRun = true;
}

// application-loopback executable path when packaged
if (app.isPackaged) {
   loopback.setExecutablesRoot(path.resolve(import.meta.dirname, "..", "..", "app.asar.unpacked", "node_modules", "application-loopback", "bin"));
}

try {
   const { HuginnApp } = await import("./huginn-app");
   await HuginnApp.create(allowedToRun);
} catch (e) {
   dialog.showErrorBox("Failed to start Huginn", `An error occurred while starting Huginn:\n\n${e instanceof Error ? e.stack : String(e)}`);
   app.exit(1);
}
