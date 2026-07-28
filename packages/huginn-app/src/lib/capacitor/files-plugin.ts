import { registerPlugin } from "@capacitor/core";

export type FileItem = {
   /** A content:// URI on Android. Picker results retain read access when the provider supports it. */
   uri: string;
   name: string;
   mimeType: string;
   size: number;
   /** Unix timestamp in milliseconds. */
   modifiedAt: number;
};

type FilesPlugin = {
   getRecentFiles(options: { limit: number }): Promise<{ files: FileItem[] }>;
   pickFiles(options?: { multiple?: boolean }): Promise<{ files: FileItem[] }>;
};

export const Files = registerPlugin<FilesPlugin>("Files");
