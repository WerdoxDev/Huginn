import type { FileCategory } from "#types";

export abstract class Storage {
	public name: string;
	public constructor(name: string) {
		this.name = name;
	}

	public abstract getFile(category: FileCategory, subDirectory: string, name: string): Promise<ArrayBuffer | undefined>;

	public abstract writeFile(category: FileCategory, subDirectory: string, name: string, data: ArrayBuffer | string): Promise<boolean> | boolean;

	public abstract exists(category: FileCategory, subDirectory: string, name: string): Promise<boolean>;
}
