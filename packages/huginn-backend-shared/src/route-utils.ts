import { zValidator } from "@hono/zod-validator";
import type { Env, Hono, MiddlewareHandler, ValidationTargets } from "hono";
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

export function validator<T extends keyof ValidationTargets, S extends ZodSchema>(
	target: T,
	schema: S,
): MiddlewareHandler<
	Env,
	string,
	{
		in: (undefined extends z.input<S> ? true : false) extends true
			? {
					[K in T]?:
						| (z.input<S> extends infer T_1
								? T_1 extends z.input<S>
									? T_1 extends ValidationTargets[K]
										? T_1
										: { [K2 in keyof T_1]?: ValidationTargets[K][K2] | undefined }
									: never
								: never)
						| undefined;
				}
			: {
					[K_1 in T]: z.input<S> extends infer T_2
						? T_2 extends z.input<S>
							? T_2 extends ValidationTargets[K_1]
								? T_2
								: { [K2_1 in keyof T_2]: ValidationTargets[K_1][K2_1] }
							: never
						: never;
				};
		out: { [K_2 in T]: z.output<S> };
	}
> {
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
