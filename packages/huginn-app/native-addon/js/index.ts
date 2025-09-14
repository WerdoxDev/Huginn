import binding from "bindings";
import fs from "node:fs/promises";
import path from "path";
import { XMLParser } from "fast-xml-parser";
import { selectBestIcon } from "./icon-selector";

export type ProcessInfo = { processId: number; windowTitle: string; cmdLine: string; exePath: string };
export type AppInfo = { displayName?: string; icon: string };

export type Addon = {
   getFileSha256(filepath: string): string;
   getExeIconBase64(exePath: string): string;
   getPngFileBase64(pngPath: string): string;
   getProcessIconBase64(processId: number): string;
   getOpenApplications(): ProcessInfo[];
   getPackagePath(processId: number): string;
};

const addon: Addon = binding({
   try: [
      ["module_root", "build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

async function getApplicationInfo(exePath: string, processId: number): Promise<AppInfo> {
   const packagePath = addon.getPackagePath(processId);

   let iconBase64;
   let displayName;

   // It's a windows packaged application
   if (packagePath) {
      console.log(packagePath);
      const appManifest = path.join(packagePath, "appxmanifest.xml");
      const content = await fs.readFile(appManifest, "utf8");
      const parser = new XMLParser({ ignoreAttributes: false });
      const json = parser.parse(content);

      let iconPath;
      const visualElement = json.Package?.Applications?.Application?.[0]?.["uap:VisualElements"];

      if (visualElement) {
         displayName = visualElement["@_DisplayName"];
         iconPath = visualElement["@_Square44x44Logo"];
      } else {
         displayName = json.Package.Properties.DisplayName;
         iconPath = json.Package.Properties.Logo;
      }

      const files = await findMatchingFiles(path.win32.join(packagePath, iconPath));
      iconPath = selectBestIcon(files);

      iconBase64 = addon.getPngFileBase64(iconPath);
   }

   if (!iconBase64) {
      iconBase64 = addon.getProcessIconBase64(processId);
   }

   if (!iconBase64) {
      iconBase64 = addon.getExeIconBase64(exePath);
   }

   return { icon: iconBase64 ?? "", displayName };
}

async function findMatchingFiles(filePath: string) {
   const dir = path.dirname(filePath);
   const baseName = path.basename(filePath, path.extname(filePath)); // "Square44x44Logo"
   const ext = path.extname(filePath); // ".png"

   try {
      const files = await fs.readdir(dir);
      const matchingFiles = files.filter((file) => {
         const fileBaseName = path.basename(file, path.extname(file));
         return fileBaseName.startsWith(baseName) && file.endsWith(ext);
      });

      return matchingFiles.map((file) => path.join(dir, file));
   } catch (error) {
      console.error("Error reading directory:", error);
      return [];
   }
}

async function exists(path: string) {
   try {
      await fs.access(path, fs.constants.R_OK);
      return true;
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      return false;
   }
}

export default { getApplicationInfo, getOpenApplications: addon.getOpenApplications };
