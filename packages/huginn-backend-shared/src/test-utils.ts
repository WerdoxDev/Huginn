import { HTTPError, HuginnAPIError, type HuginnErrorData } from "@huginn/shared";
import type { Hono } from "hono";
import { join } from "pathe";

let app: Hono;

export async function prepareServer() {
	process.env.TEST = JSON.stringify(true);
	app = (await import(join(process.cwd(), "src", "index"))).app as Hono;
}

export async function testHandler(
	path: string,
	headers: Record<string, string>,
	method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
	body?: unknown,
	returnAsRaw?: boolean,
): Promise<unknown> {
	let finalBody: unknown;
	const finalHeaders: Record<string, string> = headers;

	if (body && typeof body === "object" && method !== "GET") {
		if (body instanceof FormData) {
			finalBody = body;
		} else {
			finalHeaders["Content-Type"] = "application/json";
			finalBody = JSON.stringify(body);
		}
	}

	// let response: Response;
	// try {
	const response = await fetch(new URL(path, "http://localhost:3004"), {
		headers: finalHeaders,
		method,
		body: finalBody as BodyInit,
		redirect: "manual",
	});
	// } catch (e) {
	// 	response = e as Response;
	// }

	let responseBody: unknown;
	const headersMap = new Map(response.headers);
	if (headersMap.get("content-type")?.startsWith("application/json")) {
		responseBody = await response.json();
	}

	if (response.status >= 200 && response.status < 300) {
		return returnAsRaw ? response : responseBody;
	}

	if (response.status >= 300 && response.status < 400) {
		return response;
	}

	if (response.status >= 400 && response.status < 500) {
		let error: HuginnAPIError;
		try {
			// console.log(responseBody);
			const errorData = responseBody as HuginnErrorData;
			error = new HuginnAPIError(errorData, errorData.code, response.status, method, path, { body });
		} catch (e) {
			throw new HTTPError(response.status, await response.clone().text(), method, path, { body });
		}

		if (error) {
			throw error;
		}
	}

	if (response.status >= 500 && response.status < 600) {
		throw new HTTPError(response.status, await response.clone().text(), method, path, { body });
	}
}
