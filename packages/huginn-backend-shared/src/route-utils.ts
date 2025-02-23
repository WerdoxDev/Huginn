import { zValidator } from "@hono/zod-validator";
import type { Context, Hono, ValidationTargets } from "hono";
import type { OnHandlerInterface } from "hono/types";
import sharp from "sharp";
import type { ZodSchema } from "zod";
import { invalidFormBody, notFound } from "./errors";

let appInstance: Hono;

export function setAppInstance(app: Hono): void {
	appInstance = app;
}

// @ts-ignore
const createRoute: OnHandlerInterface = (method, path: string, ...handlers) => {
	appInstance.on(method, path, ...handlers);
};

export { createRoute };

// @ts-ignore
export function validator<T extends keyof ValidationTargets, S extends ZodSchema>(target: T, schema: S) {
	return zValidator(target, schema, (result, c) => {
		if (!result.success) {
			return target === "json" ? invalidFormBody(c) : notFound(c);
		}
	});
}

export async function catchError<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
	try {
		return [null, await fn()];
	} catch (e) {
		return [e as Error, null];
	}
}

export function waitUntil(c: Context, callback: () => Promise<unknown>) {
	let promises = c.get("waitUntilPromises");
	if (!promises) {
		promises = [callback];
	} else {
		promises.push(callback);
	}

	c.set("waitUntilPromises", promises);
}

export async function getImageData(source: string | ArrayBuffer) {
	try {
		let arrayBuffer: ArrayBuffer;
		if (typeof source === "string") {
			arrayBuffer = await (await fetch(source)).arrayBuffer();
		} else {
			arrayBuffer = source;
		}

		const metadata = await sharp(arrayBuffer).metadata();
		// const newDimensions = constrainImageSize(metadata.width ?? 0, metadata.height ?? 0, maxWidth, maxHeight, true);

		return { width: metadata.width ?? 0, height: metadata.height ?? 0 };
	} catch (e) {
		console.error("Error fetching image data:", e);
		return undefined;
	}
}
