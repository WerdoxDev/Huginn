import { logCDNRequest } from "@huginn/backend-shared";
import {
	HTTPError,
	type HandlerRequestData,
	type InternalRequest,
	type RequestData,
	RequestMethod,
	type ResponseLike,
	type RouteLike,
	parseResponse,
	resolveRequest,
} from "@huginn/shared";
import { envs } from "#setup";

export async function cdnUpload<T>(fullRoute: RouteLike, options: RequestData = {}) {
	if (!envs.CDN_ROOT) {
		throw new Error("CDN Root was not configured");
	}

	logCDNRequest(fullRoute, RequestMethod.POST);
	return (await request({ ...options, root: envs.CDN_ROOT, method: RequestMethod.POST, fullRoute, throw: true })) as Promise<T>;
}

export async function serverFetch<T>(url: string, method: RequestMethod, options: RequestData & { throw?: boolean; token?: string }) {
	const fullUrl = new URL(url);
	return (await request({
		...options,
		root: fullUrl.origin,
		fullRoute: fullUrl.pathname as `/${string}`,
		method,
		token: options.token,
		auth: options.token !== undefined,
		authPrefix: "Bearer",
	})) as Promise<T>;
}

export async function request(options: InternalRequest & { throw?: boolean }): Promise<unknown> {
	const { url, fetchOptions } = await resolveRequest(options);

	const response = await fetch(url, fetchOptions);

	if (response.ok || !options.throw) return parseResponse(response);

	if (response.status >= 400 && response.status < 600) {
		throw new HTTPError(response.status, response.statusText, options.method, url, fetchOptions);
	}

	return response;
}
