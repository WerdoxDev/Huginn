// biome-ignore lint/style/useNodejsImportProtocol: <explanation>
import { Buffer } from "buffer";
import type { Base64Resolvable, BufferResolvable, ResolvedFile } from "@huginn/shared";

/**
 * Resolves a base64 data url string, URL, file path, or Buffer to a base64 data url string
 */
export async function resolveImage(image: Base64Resolvable): Promise<string | undefined> {
	if (typeof image === "string" && image.startsWith("data:")) {
		return image;
	}
	const file = await resolveFile(image);
	if (!file) {
		return undefined;
	}
	return resolveBase64(file.data);
}

/**
 * Resolves a Buffer to a base64 data url
 */
export function resolveBase64(data: Base64Resolvable): string {
	if (Buffer.isBuffer(data)) return `data:image/png;base64,${data.toString("base64")}`;
	return data;
}

/**
 * Resolves a base64 data url string to a Buffer
 */
export function resolveBuffer(data: string): Buffer {
	return Buffer.from(data.split(",")[1], "base64");
}

/**
 * Resolves a Buffer, URL, file path to a Buffer
 */
export async function resolveFile(resource: BufferResolvable): Promise<ResolvedFile | undefined> {
	if (Buffer.isBuffer(resource)) return { data: resource };

	if (typeof resource[Symbol.asyncIterator as unknown as number] === "function") {
		const buffers = [];
		for await (const data of resource) buffers.push(Buffer.from(data));
		return { data: Buffer.concat(buffers) };
	}

	if (typeof resource === "string") {
		if (/^https?:\/\//.test(resource)) {
			const res = await fetch(resource);
			if (res.status !== 200) {
				return undefined;
			}
			return { data: Buffer.from(await res.arrayBuffer()), contentType: res.headers.get("content-type") ?? undefined };
		}

		if (typeof window === "undefined") {
			// @ts-ignore: non browser packages
			const fs = await import("node:fs/promises");
			// @ts-ignore: non browser packages
			const path = await import("node:path");

			// @ts-ignore: non browser packages
			const file = path.join(resource);

			const stats = await fs.stat(file);
			if (!stats.isFile()) throw new Error(`File was not found: ${file}`);
			return { data: await fs.readFile(file) };
		}
	}

	throw new Error("The provided resource type was not valid");
}
