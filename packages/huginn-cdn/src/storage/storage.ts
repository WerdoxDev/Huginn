import type { FileCategory } from "#utils/types";

export abstract class Storage {
	public name: string;
	public constructor(name: string) {
		this.name = name;
	}

	public abstract getFile(
		category: FileCategory,
		subDirectory: string,
		name: string,
		start?: number,
		end?: number,
	): Promise<ReadableStream | undefined>;

	public abstract writeFile(category: FileCategory, subDirectory: string, name: string, data: ReadableStream): Promise<boolean> | boolean;

	public abstract exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean>;

	public abstract stat(category: FileCategory, subDirectory: string, name: string): Promise<unknown>;
}
