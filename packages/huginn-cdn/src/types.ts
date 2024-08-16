export const FileTypes = {
   png: "image/png",
   jpeg: "image/jpeg",
   jpg: "image/jpeg",
   webp: "image/webp",
   gif: "image/gif",
   zip: "application/zip",
   other: "application/octet-stream",
} as const;

export type FileFormats = keyof typeof FileTypes | (string & {});
export type FileContentTypes = (typeof FileTypes)[keyof typeof FileTypes];

export type FileInfo = {
   name: string;
   format: FileFormats;
   mimeType: FileContentTypes;
};