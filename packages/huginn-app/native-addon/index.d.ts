declare module "native-addon" {
   export type AppInfo = { processId: number; windowTitle: string; exePath: string };

   export function getFileSha256(filepath: string): string;
   export function getExeLargeIcon(exePath: string, processId: number): string;
   export function enumerateOpenApplications(): AppInfo[];
}
