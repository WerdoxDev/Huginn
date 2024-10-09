import type { FileCategory } from "#types";

export abstract class Storage {
	public abstract getFile(category: FileCategory, name: string): Promise<ReadableStream | undefined>;

	public abstract writeFile(category: FileCategory, name: string, data: Blob | Uint8Array | ArrayBuffer): Promise<boolean> | boolean;

	public abstract exists(category: FileCategory, name: string): Promise<boolean>;
}
