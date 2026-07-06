import binding from "bindings";

export type ProcessInfo = {
   processId: number;
   windowTitle: string;
   cmdLine: string;
   exePath: string;
};
export type AppInfo = { displayName?: string; icon: string };

export type Addon = {
   getFileSha256(filepath: string): string;
   getProcessIconBase64(processId: number): string;
   getOpenApplications(): ProcessInfo[];
   getPackageDisplayName(processId: number): string;
   getApplicationInfo(processId: number): AppInfo | null;
};

const addon: Addon = binding({
   try: [
      ["module_root", "build", "Release", "huginn_addon.node"],
      ["native-addon", "build", "Release", "huginn_addon.node"],
   ],
});

export default { ...addon };
