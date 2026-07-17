import binding from "bindings";

export type ProcessInfo = {
   processId: number;
   windowTitle: string;
   cmdLine: string;
   exePath: string;
   hwnd: number;
};

export type Addon = {
   getFileSha256(filepath: string): string;
   getProcessIconBase64(processId: number): Promise<string | null>;
   getOpenApplications(): ProcessInfo[];
   getPackageDisplayName(processId: number): string;
   getWindowThumbnailBase64(hwnd: number, thumbW: number, thumbH: number): Promise<string | null>;
   getScreenThumbnailBase64(x: number, y: number, width: number, height: number): Promise<string | null>;
};

const addon: Addon = binding({
   try: [
      ["module_root", "build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

export default { ...addon };
