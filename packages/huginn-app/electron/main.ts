import { app, dialog } from "electron";
import "dotenv/config";
import { platform } from "node:os";
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

if (platform() === "linux") {
   const isHyprland = process.env.XDG_CURRENT_DESKTOP === "Hyrpland" || Boolean(process.env.HYPRLAND_INSTANCE_SIGNATURE);
   if (!isHyprland) {
      dialog.showErrorBox("Unsupported compositor", "Huginn on linux requires to run on Hyprland :(");
      app.exit(1);
   }
}

try {
   const { HuginnApp } = await import("./huginn-app");
   await HuginnApp.create(allowedToRun);
} catch (e) {
   dialog.showErrorBox("Failed to start Huginn", `An error occurred while starting Huginn:\n\n${e instanceof Error ? e.stack : String(e)}`);
   app.exit(1);
}
