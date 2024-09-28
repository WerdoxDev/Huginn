import { logCDNRequest } from "@huginn/backend-shared";
import { HTTPError, type InternalRequest, type RequestData, RequestMethod, type RouteLike, parseResponse, resolveRequest } from "@huginn/shared";

export const cdnRoot = process.env.CDN_ROOT;

export async function cdnUpload(fullRoute: RouteLike, options: RequestData = {}) {
	if (!cdnRoot) {
		throw new Error("CDN Root was not configured");
	}

	return await request({ ...options, root: cdnRoot, method: RequestMethod.POST, fullRoute });
}

export async function request(options: InternalRequest): Promise<unknown> {
	logCDNRequest(options.fullRoute, options.method);

	const { url, fetchOptions } = resolveRequest(options);

	const response = await fetch(url, fetchOptions);

	if (response.ok) return parseResponse(response);

	if (response.status >= 500 && response.status < 600) {
		throw new HTTPError(response.status, response.statusText, options.method, url, fetchOptions);
	}

	return response;
}
