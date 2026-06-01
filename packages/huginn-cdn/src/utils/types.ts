import type { FileContentTypes, FileFormats } from "@huginn/shared";

export type FileInfo = {
   name: string;
   format: FileFormats;
   extension: string;
   mimeType: FileContentTypes;
};

export type FileCategory = "avatars" | "banners" | "channel-icons" | "attachments" | "application-icons" | "twemoji";
