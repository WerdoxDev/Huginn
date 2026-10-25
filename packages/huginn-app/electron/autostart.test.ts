import { afterEach, beforeEach, describe, expect, it, mock } from "bun:test";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const electronApp = {
   isPackaged: true,
   getPath: (name: string) => (name === "appData" ? directory : executable),
   setLoginItemSettings: mock(),
};
mock.module("electron", () => ({ app: electronApp }));

const { applyAutostartSettings } = await import("./autostart");
const originalPlatform = process.platform;
const originalAppImage = process.env.APPIMAGE;
let directory: string;
let executable: string;

beforeEach(async () => {
   directory = await fs.mkdtemp(path.join(os.tmpdir(), "huginn-autostart-"));
   executable = "/opt/Huginn/huginn-app-react";
   Object.defineProperty(process, "platform", { value: "linux", configurable: true });
   delete process.env.APPIMAGE;
   electronApp.isPackaged = true;
   electronApp.setLoginItemSettings.mockClear();
});

afterEach(async () => {
   Object.defineProperty(process, "platform", { value: originalPlatform, configurable: true });
   if (originalAppImage === undefined) delete process.env.APPIMAGE;
   else process.env.APPIMAGE = originalAppImage;
   await fs.rm(directory, { recursive: true, force: true });
});

describe("desktop autostart", () => {
   it("creates a Linux login entry and removes it when disabled", async () => {
      const filename = path.join(directory, "autostart", "dev.huginn.Huginn.desktop");
      await applyAutostartSettings(true);
      expect(await fs.readFile(filename, "utf-8")).toBe(
         '[Desktop Entry]\nType=Application\nName=Huginn\nExec="/opt/Huginn/huginn-app-react" --silent\nTerminal=false\n',
      );
      await applyAutostartSettings(false);
      expect(await fs.exists(filename)).toBe(false);
      // Reapplying the saved disabled preference must also work on next launch.
      await applyAutostartSettings(false);
      expect(await fs.exists(filename)).toBe(false);
   });

   it("uses the persistent AppImage launcher and quotes paths with spaces", async () => {
      process.env.APPIMAGE = "/home/user/My Apps/Huginn.AppImage";
      await applyAutostartSettings(true);
      const content = await fs.readFile(path.join(directory, "autostart", "dev.huginn.Huginn.desktop"), "utf-8");
      expect(content).toContain('Exec="/home/user/My Apps/Huginn.AppImage" --silent\n');
   });

   it("escapes desktop entry field codes and reserved characters in the executable path", async () => {
      executable = '/opt/50%/$Huginn`"\\/app';
      await applyAutostartSettings(true);
      const content = await fs.readFile(path.join(directory, "autostart", "dev.huginn.Huginn.desktop"), "utf-8");
      const escaped = '/opt/50%%/' + "\\\\$Huginn\\\\`\\\\\"\\\\\\\\/app";
      expect(content).toContain(`Exec="${escaped}" --silent\n`);
   });

   it("rejects executable paths containing line breaks", async () => {
      executable = "/opt/Huginn\nHidden=true";
      await expect(applyAutostartSettings(true)).rejects.toThrow("line breaks");
      expect(await fs.exists(path.join(directory, "autostart"))).toBe(false);
   });

   for (const platform of ["win32", "darwin"]) {
      it(`enables and disables native login items on ${platform}`, async () => {
         Object.defineProperty(process, "platform", { value: platform, configurable: true });
         await applyAutostartSettings(true);
         expect(electronApp.setLoginItemSettings).toHaveBeenLastCalledWith({ openAtLogin: true, path: executable, args: ["--silent"] });
         await applyAutostartSettings(false);
         expect(electronApp.setLoginItemSettings).toHaveBeenLastCalledWith({ openAtLogin: false, path: executable, args: ["--silent"] });
         expect(await fs.readdir(directory)).toEqual([]);
      });
   }

   it("leaves login items untouched in development", async () => {
      electronApp.isPackaged = false;
      await applyAutostartSettings(true);
      await applyAutostartSettings(false);
      expect(electronApp.setLoginItemSettings).not.toHaveBeenCalled();
      expect(await fs.readdir(directory)).toEqual([]);
   });

   it("reports filesystem errors when login registration fails", async () => {
      await fs.writeFile(path.join(directory, "autostart"), "blocked");
      await expect(applyAutostartSettings(true)).rejects.toThrow();
   });
});
