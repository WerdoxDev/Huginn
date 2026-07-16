import binding from "bindings";

export type ProcessInfo = {
   processId: number;
   windowTitle: string;
   cmdLine: string;
   exePath: string;
   hwnd: number;
};
export type AppInfo = { displayName: string; icon: string | null };

export type Addon = {
   getFileSha256(filepath: string): string;
   getProcessIconBase64(processId: number): string | null;
   getOpenApplications(): ProcessInfo[];
   getPackageDisplayName(processId: number): string;
   getApplicationInfo(processId: number): AppInfo;
   getWindowThumbnailBase64(hwnd: number, thumbW: number, thumbH: number): string | null;
   getScreenThumbnailBase64(x: number, y: number, width: number, height: number): string | null;
};

const addon: Addon = binding({
   try: [
      ["module_root", "build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

export default { ...addon };
