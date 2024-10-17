import { type H3Event, createError, getQuery, getRouterParams, readBody } from "h3";
import type { z } from "zod";
import { invalidFormBody } from "./route-errors.ts";

export async function useValidatedBody<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
	try {
		const body = await readBody(event);
		const parsedBody = await schema.parse(body);
		return parsedBody;
	} catch (e) {
		throw invalidFormBody(event);
	}
}

export async function useValidatedParams<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
	try {
		const params = getRouterParams(event);
		const parsedParams = await schema.parse(params);
		return parsedParams;
	} catch (e) {
		throw createError({ statusCode: 404 });
	}
}

export async function useValidatedQuery<T extends z.Schema>(event: H3Event, schema: T): Promise<z.infer<T>> {
	try {
		const query = getQuery(event);
		const parsedQuery = await schema.parse(query);
		return parsedQuery;
	} catch (e) {
		throw createError({ statusCode: 404 });
	}
}

export async function catchError<T>(fn: (() => Promise<T>) | (() => T)): Promise<[Error, null] | [null, T]> {
	try {
		return [null, await fn()];
	} catch (e) {
		return [e as Error, null];
	}
}
