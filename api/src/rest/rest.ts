import { HuginnErrorData } from "@shared/errors";
import {
   HandlerRequestData,
   InternalRequest,
   RequestData,
   RequestHeaders,
   RequestMethod,
   ResolvedRequest,
   ResponseLike,
} from "@shared/rest-types";
import { RouteLike } from "@shared/routes";
import { HuginnClient } from "..";
import { RESTOptions } from "../types";
import { HTTPError } from "../errors/http-error";
import { HuginnAPIError } from "../errors/huginn-error";
import { parseResponse } from "../utils";
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
      return this.request({ ...options, fullRoute, method: RequestMethod.GET });
   }

   /**
    * Runs a POST request from the api
    *
    * @param fullRoute - The full route to query
    * @param options - Optional request options
    */
   public async post(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
      return this.request({ ...options, fullRoute, method: RequestMethod.POST });
   }

   /**
    * Runs a PUT request from the api
    *
    * @param fullRoute - The full route to query
    * @param options - Optional request options
    */
   public async put(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
      return this.request({ ...options, fullRoute, method: RequestMethod.PUT });
   }

   /**
    * Runs a PATCH request from the api
    *
    * @param fullRoute - The full route to query
    * @param options - Optional request options
    */
   public async patch(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
      return this.request({ ...options, fullRoute, method: RequestMethod.PATCH });
   }

   /**
    * Runs a DELETE request from the api
    *
    * @param fullRoute - The full route to query
    * @param options - Optional request options
    */
   public async delete(fullRoute: RouteLike, options: RequestData = {}): Promise<unknown> {
      return this.request({ ...options, fullRoute, method: RequestMethod.DELETE });
   }

   /**
    * Runs a request from the api
    *
    * @param options - Request options
    */
   public async request(options: InternalRequest): Promise<unknown> {
      const { url, fetchOptions } = this.resolveRequest(options);

      const response = await this.options.makeRequest(url, fetchOptions);

      if (response.ok) return parseResponse(response);

      return this.handleErrors(response, options.method, url, fetchOptions);
   }

   /**
    * Format the request to use in a fetch
    *
    * @param request - The request data
    */
   public resolveRequest(request: InternalRequest): ResolvedRequest {
      let query = "";
      let finalBody: RequestInit["body"];
      let additionalHeaders: Record<string, string> = {};

      if (request.query) {
         query = `?${request.query}`;
      }

      // Required headers
      const headers: RequestHeaders = {};

      if (request.auth) {
         if (!this.client.tokenHandler.token) {
            throw new Error("Expected token for a request, but wasn't present " + request.fullRoute);
         }

         headers.Authorization = `${request.authPrefix ?? this.options.authPrefix} ${this.client.tokenHandler.token}`;
      }

      if (request.reason?.length) {
         headers["X-Log-Reason"] = encodeURIComponent(request.reason);
      }

      const url = `${this.options.api}${request.fullRoute}${query}`;

      // TODO: Implement form data
      if (request.body) {
         finalBody = JSON.stringify(request.body);
         additionalHeaders = { "Content-Type": "application/json" };
      }

      const method = request.method.toUpperCase();

      const fetchOptions: RequestInit = {
         // If for some reason we pass a body to a GET or HEAD request, remove the body
         body: ["GET", "HEAD"].includes(method) ? null : finalBody,
         headers: { ...request.headers, ...headers, ...additionalHeaders },
         method,
      };

      return { url, fetchOptions };
   }

   public async handleErrors(
      response: ResponseLike,
      method: string,
      url: string,
      requestData: HandlerRequestData
   ): Promise<ResponseLike> {
      const status = response.status;

      if (status >= 500 && status < 600) {
         throw new HTTPError(status, response.statusText, method, url, requestData);
      }

      if (status >= 400 && status < 500) {
         // If we receive this status code, it means the token is not valid.
         if (status === 401 && requestData.auth) {
            console.log("fuck");
            this.client.tokenHandler.token = null!;
            this.client.user = undefined;
         }

         const data = (await parseResponse(response)) as HuginnErrorData;

         // throw the API error
         throw new HuginnAPIError(data, data.code, status, method, url, requestData);
      }

      return response;
   }
}
