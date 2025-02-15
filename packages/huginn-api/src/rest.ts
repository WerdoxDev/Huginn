import { HTTPError, type HuginnErrorData, resolveRequest } from "@huginn/shared";
import { type HandlerRequestData, type InternalRequest, type RequestData, type ResponseLike, parseResponse } from "@huginn/shared";
import type { RouteLike } from "@huginn/shared";
import { HuginnAPIError } from "@huginn/shared";
import type { HuginnClient } from ".";
import type { RESTOptions } from "./types";
import { defaultClientOptions } from "./utils";

export class REST {
	public readonly options: RESTOptions;
	private client: HuginnClient;

	public constructor(client: HuginnClient, options: Partial<RESTOptions> = {}) {
		this.options = { ...defaultClientOptions.rest, ...options };

		this.client = client;
	}

	/**
	 * Runs a GET request from the api
	 *
	 * @param fullRoute - The full route to query
	 * @param options - Optional request options
	 */
	public async get(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
		return this.request({ ...options, fullRoute, method: "GET" });
	}

	/**
	 * Runs a POST request from the api
	 *
	 * @param fullRoute - The full route to query
	 * @param options - Optional request options
	 */
	public async post(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
		return this.request({ ...options, fullRoute, method: "POST" });
	}

	/**
	 * Runs a PUT request from the api
	 *
	 * @param fullRoute - The full route to query
	 * @param options - Optional request options
	 */
	public async put(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
		return this.request({ ...options, fullRoute, method: "PUT" });
	}

	/**
	 * Runs a PATCH request from the api
	 *
	 * @param fullRoute - The full route to query
	 * @param options - Optional request options
	 */
	public async patch(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
		return this.request({ ...options, fullRoute, method: "PATCH" });
	}

	/**
	 * Runs a DELETE request from the api
	 *
	 * @param fullRoute - The full route to query
	 * @param options - Optional request options
	 */
	public async delete(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
		return this.request({ ...options, fullRoute, method: "DELETE" });
	}

	/**
	 * Runs a request from the api
	 *
	 * @param options - Request options
	 */
	public async request(options: Omit<InternalRequest, "root">): Promise<unknown> {
		const { url, fetchOptions } = await resolveRequest({
			...options,
			token: options.token ?? this.client.tokenHandler.token,
			root: this.options.api,
			authPrefix: this.options.authPrefix,
		});

		let response: ResponseLike;
		if (options.xhr && globalThis === window) {
			response = await this.sendXHRRequest(url, fetchOptions, options.xhr);
		} else {
			response = await this.options.makeRequest(url, fetchOptions);
		}

		if (response.ok) return parseResponse(response);

		return this.handleErrors(response, options.method, url, fetchOptions);
	}

	public async handleErrors(response: ResponseLike, method: string, url: string, requestData: HandlerRequestData): Promise<ResponseLike> {
		const status = response.status;

		if (status >= 500 && status < 600) {
			throw new HTTPError(status, response.statusText, method, url, requestData);
		}

		if (status >= 400 && status < 500) {
			// If we receive this status code, it means the token is not valid.
			if (status === 401 && requestData.auth) {
				this.client.tokenHandler.token = undefined;
				this.client.user = undefined;
			}

			const data = (await parseResponse(response)) as HuginnErrorData;

			// throw the API error
			throw new HuginnAPIError(data, data.code, status, method, url, requestData);
		}

		return response;
	}

	private async sendXHRRequest(url: string, init: RequestInit, xhrOptions: RequestData["xhr"]) {
		const xhr = new XMLHttpRequest();
		xhr.open(init.method ?? "GET", url);

		if (init.headers) {
			for (const [key, value] of Object.entries(init.headers)) {
				xhr.setRequestHeader(key, value);
			}
		}

		xhr.upload.onprogress = (event) => {
			xhrOptions?.onUploadProgress?.(event);
		};

		xhr.send(init.body as XMLHttpRequestBodyInit);

		const result = await new Promise<ResponseLike>((resolve, reject) => {
			xhr.onload = () => {
				const headers = xhr.getAllResponseHeaders();
				const array = headers.trim().split(/[\r\n]+/);

				// Create a map of header names to values
				const headerMap: Record<string, string> = {};
				for (const line of array) {
					const parts = line.split(": ");
					const header = parts.shift();
					const value = parts.join(": ");

					if (header) {
						headerMap[header] = value;
					}
				}

				const blob = new Blob([xhr.response]);

				resolve({
					status: xhr.status,
					headers: new Headers(headerMap),
					json: () => JSON.parse(xhr.responseText),
					body: blob.stream(),
					ok: xhr.status >= 200 && xhr.status < 300,
					bodyUsed: false,
					statusText: xhr.statusText,
					text: async () => xhr.responseText,
					arrayBuffer: async () => {
						throw Error("Arraybuffer response is not available with XHR requests");
					},
				});
			};
		});

		return result;
	}
}
