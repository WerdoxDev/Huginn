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

export type ImageType = "png" | "jpeg" | "jpg" | "gif";

export type ResponseLike = {
   body: Readable | ReadableStream | null;
} & Pick<Response, "arrayBuffer" | "bodyUsed" | "headers" | "json" | "ok" | "status" | "statusText" | "text">;

export type RawFile = {
   /**
    * Content-Type of the file
    */
   contentType?: string;
   /**
    * The actual data for the file
    */
   data: Buffer | Uint8Array | boolean | number | string;
   /**
    * An explicit key to use for key of the formdata field for this file.
    * When not provided, the index of the file in the files array is used in the form `files[${index}]`.
    * If you wish to alter the placeholder snowflake, you must provide this property in the same form (`files[${placeholder}]`)
    */
   key?: string;
   /**
    * The name of the file
    */
   name: string;
};

export type RequestData = {
   /**
    * Whether to append JSON data to form data instead of `payload_json` when sending files
    */
   appendToFormData?: boolean;

   /**
    * If this request needs 'Authorization' header
    */
   auth?: boolean;

   authPrefix?: "Bearer";

   body?: BodyInit | unknown;

   /**
    * Files to be attached to this request
    */
   files?: RawFile[] | undefined;

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
   root: string;
   fullRoute: RouteLike;
   method: RequestMethod;
   token?: string;
} & RequestData;

export type HandlerRequestData = Pick<InternalRequest, "auth" | "body" | "files">;

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

export type Base64Resolvable = Buffer | string;
export type BufferResolvable = Buffer | string;

export type ResolvedFile = {
   data: Buffer;
   contentType?: string;
};
