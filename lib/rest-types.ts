import { Readable } from "stream";
import { RouteLike } from "./types";

export enum RequestMethod {
   DELETE = "DELETE",
   GET = "GET",
   PATCH = "PATCH",
   POST = "POST",
   PUT = "PUT",
}

export interface RESTOptions {
   api: string;
   authPrefix: "Bearer";
   makeRequest(url: string, init: RequestInit): Promise<ResponseLike>;
}

export interface ResponseLike
   extends Pick<Response, "arrayBuffer" | "bodyUsed" | "headers" | "json" | "ok" | "status" | "statusText" | "text"> {
   body: Readable | ReadableStream | null;
}

export interface RequestData {
   /**
    * If this request needs 'Authorization' header
    * @defaultValue true
    */
   auth?: boolean;

   authPrefix?: "Bearer";

   body?: BodyInit | unknown;

   /**
    * Additional headers for this request
    */
   headers?: Record<string, string>;

   /**
    * Query string parameters to append to the called endpoint
    */
   query?: URLSearchParams;

   /**
    * Reason to show in log
    */
   reason?: string | undefined;
}

export interface InternalRequest extends RequestData {
   fullRoute: RouteLike;
   method: RequestMethod;
}

// TODO: add 'files'
export type HandlerRequestData = Pick<InternalRequest, "auth" | "body">;

/**
 * Possible headers for an API call
 */
export interface RequestHeaders {
   Authorization?: string;
   "X-Log-Reason"?: string;
}

export interface ResolvedRequest {
   fetchOptions: RequestInit;
   url: string;
}
