import type { FileContentTypes, FileFormats } from "@huginnjs/shared";

export type FileInfo = {
   name: string;
   format: FileFormats;
   extension: string;
   mimeType: FileContentTypes;
};

export type FileCategory = "avatars" | "banners" | "channel-icons" | "attachments" | "application-icons" | "emojis" | "channel-backgrounds";
