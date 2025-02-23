import type { FileContentTypes, FileFormats } from "@huginn/shared";

export type FileInfo = {
	name: string;
	format: FileFormats;
	extension: string;
	mimeType: FileContentTypes;
};

export type FileCategory = "avatars" | "channel-icons" | "attachments";

declare module "hono" {
	interface ContextVariableMap {
		id: string;
		startTime: number;
	}
}
