import type { ResolvedFile } from "@huginn/shared";
import { decodeBase64, encodeBase64 } from "@std/encoding";

/**
 * Resolves a base64 data url string, URL, file path, to a base64 data url string
 */
export async function resolveImage(image: string): Promise<string | undefined> {
	if (typeof image === "string" && image.startsWith("data:")) {
		return image;
	}
	const file = await resolveFile(image);
	if (!file) {
		return undefined;
	}
	return toDataUrl(file.data);
}

/**
 * Resolves a Uint8Array, ArrayBuffer or string to a base64 data url
 */
export function toDataUrl(data: Uint8Array | ArrayBuffer | string): string {
	return `data:image/png;base64,${encodeBase64(data)}`;
}

/**
 * Resolves a base64 data url string to a ArrayBuffer
 */
export function toArrayBuffer(data: string): ArrayBuffer {
	return decodeBase64(data.split(",")[1]).buffer as ArrayBuffer;
}

/**
 * Resolves an ArrayBuffer, URL, file path to an ArrayBuffer
 */
export async function resolveFile(resource: ArrayBuffer | string): Promise<ResolvedFile | undefined> {
	if (typeof resource !== "string") {
		return { data: resource };
	}

	if (/^https?:\/\//.test(resource)) {
		const res = await fetch(resource);
		if (res.status !== 200) {
			return undefined;
		}

		return { data: await res.arrayBuffer(), contentType: res.headers.get("content-type") ?? undefined };
	}

	if (typeof window === "undefined") {
		// @ts-ignore: non browser packages
		const fs = await import("node:fs/promises");
		// @ts-ignore: non browser packages
		const bun = await import("bun");
		// @ts-ignore: non browser packages
		const path = await import("node:path");

		// @ts-ignore: non browser packages
		const file = path.join(resource);

		const stats = await fs.stat(file);
		if (!stats.isFile()) {
			throw new Error(`File was not found: ${file}`);
		}

		return { data: await bun.file(file).arrayBuffer() };
	}

	throw new Error("The provided resource type was not valid");
}
