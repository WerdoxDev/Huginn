import { error, log } from "@huginn/shared";
import * as loopback from "application-loopback";
import { app, dialog } from "electron";
import path from "node:path";
import "dotenv/config";

let allowedToRun: boolean = false;
try {
   if (process.defaultApp) {
      if (process.argv.length >= 2) {
         const args = process.argv[1];
         log("app:electron", "default", "set deep link", "exep:", process.execPath, "args:", args);

         app.setAsDefaultProtocolClient("huginn", process.execPath, [path.resolve(args)]);
      }
   } else {
      app.setAsDefaultProtocolClient("huginn");
   }

   allowedToRun = app.requestSingleInstanceLock();

   if (!allowedToRun) {
      log("app:electron", "default", "exit because of lock");

      app.exit();
   }
} catch (e) {
   error("app:electron", "Default protocol registration or single instance lock failed:", e);
}

// application-loopback executable path when packaged
if (app.isPackaged) {
   loopback.setExecutablesRoot(path.resolve(import.meta.dirname, "..", "..", "app.asar.unpacked", "node_modules", "application-loopback", "bin"));
}

try {
   const { HuginnApp } = await import("./huginn-app");
   const huginn = new HuginnApp(allowedToRun);
   await huginn.initAsync();
} catch (e) {
   dialog.showErrorBox("Failed to start Huginn", `An error occurred while starting Huginn:\n\n${e instanceof Error ? e.stack : String(e)}`);
   app.exit(1);
}
