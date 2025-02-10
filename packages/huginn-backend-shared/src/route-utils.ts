import { zValidator } from "@hono/zod-validator";
import type { Context, Env, Hono, MiddlewareHandler, ValidationTargets } from "hono";
import type { OnHandlerInterface } from "hono/types";
import type { ZodSchema, z } from "zod";
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
