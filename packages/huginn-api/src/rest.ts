import type { RouteLike } from "@huginnjs/shared";

import { HTTPError, type HuginnErrorData, isBrowser, resolveRequest } from "@huginnjs/shared";
import { type HandlerRequestData, type InternalRequest, type RequestData, type ResponseLike, parseResponse } from "@huginnjs/shared";
import { HuginnAPIError } from "@huginnjs/shared";

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
      const managedAuth = !!options.auth && options.token === undefined;
      const version = this.client.tokenHandler.sessionVersion;
      if (managedAuth) await this.client.tokenHandler.ensureValidToken();
      return this.sendRequest(options, managedAuth, version, true);
   }

   private async sendRequest(options: Omit<InternalRequest, "root">, managedAuth: boolean, version: number, retry: boolean): Promise<unknown> {
      const token = options.token ?? this.client.tokenHandler.token;
      const { url, fetchOptions } = await resolveRequest({
         ...options,
         token,
         root: this.options.api,
         authPrefix: this.options.authPrefix,
      });

      // Body preparation can yield while the user signs out or changes account.
      if (managedAuth && version !== this.client.tokenHandler.sessionVersion) throw new Error("Session changed while making a request");
      options.xhr?.signal?.throwIfAborted();
      let response: ResponseLike;
      if (options.xhr?.enabled && isBrowser()) {
         response = await this.sendXHRRequest(url, fetchOptions, options.xhr);
      } else {
         response = await this.options.makeRequest(url, fetchOptions);
      }

      if (response.ok) return parseResponse(response);

      const currentSession = managedAuth && version === this.client.tokenHandler.sessionVersion;
      if (response.status === 401 && currentSession && retry) {
         // Another request may already have refreshed the token used by this request.
         const refreshed = token !== this.client.tokenHandler.token || (await this.client.tokenHandler.refresh());
         if (refreshed && version === this.client.tokenHandler.sessionVersion && this.client.tokenHandler.token) {
            return this.sendRequest(options, managedAuth, version, false);
         }
      }

      return this.handleErrors(response, options.method, url, {
         ...options,
         auth: managedAuth && version === this.client.tokenHandler.sessionVersion && token === this.client.tokenHandler.token,
      });
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

      function abortListener() {
         xhr.abort();
      }

      xhrOptions?.signal?.addEventListener("abort", abortListener);

      xhr.addEventListener("readystatechange", () => {
         if (xhr.readyState === XMLHttpRequest.DONE) {
            xhrOptions?.signal?.removeEventListener("abort", abortListener);
         }
      });

      xhr.upload.onprogress = (event) => {
         xhrOptions?.onUploadProgress?.(event);
      };

      xhr.send(init.body as XMLHttpRequestBodyInit);

      const result = new Promise<ResponseLike>((resolve, reject) => {
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

         xhr.onerror = (e) => {
            reject(e);
         };
      });

      return result;
   }
}
