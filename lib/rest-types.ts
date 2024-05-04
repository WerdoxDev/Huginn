import { Readable } from "stream";
import { RouteLike } from "./routes";
import { URLSearchParams } from "url";

export enum RequestMethod {
   DELETE = "DELETE",
   GET = "GET",
   PATCH = "PATCH",
   POST = "POST",
   PUT = "PUT",
}

export type ResponseLike = {
   body: Readable | ReadableStream | null;
} & Pick<Response, "arrayBuffer" | "bodyUsed" | "headers" | "json" | "ok" | "status" | "statusText" | "text">;

export type RequestData = {
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
};

export type InternalRequest = {
   fullRoute: RouteLike;
   method: RequestMethod;
} & RequestData;

// TODO: add 'files'
export type HandlerRequestData = Pick<InternalRequest, "auth" | "body">;

/**
 * Possible headers for an API call
 */
export type RequestHeaders = {
   Authorization?: string;
   "X-Log-Reason"?: string;
};

export type ResolvedRequest = {
   fetchOptions: RequestInit;
   url: string;
};
