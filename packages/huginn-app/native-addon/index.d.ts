declare module "native-addon" {
   export function getFileSha256(filepath: string): string;
   export function getExeLargeIcon(exePath: string): string;
}
