import { HTTPError, type HuginnErrorData, resolveRequest } from "@huginn/shared";
import { type HandlerRequestData, type InternalRequest, type RequestData, type ResponseLike, parseResponse } from "@huginn/shared";
import type { RouteLike } from "@huginn/shared";
import { HuginnAPIError } from "@huginn/shared";
import type { HuginnClient } from "../..";
import type { RESTOptions } from "../types";
import { DefaultRestOptions } from "./rest-utils";

export class REST {
	public readonly options: RESTOptions;
	private client: HuginnClient;

	public constructor(client: HuginnClient, options: Partial<RESTOptions> = {}) {
		this.options = { ...DefaultRestOptions, ...options };

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

		const response = await this.options.makeRequest(url, fetchOptions);

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
}
