import filetypeinfo from "magic-bytes.js";
import { InternalRequest, RequestHeaders, ResolvedRequest, ResponseLike } from "./rest-types";

export function isBufferLike(value: unknown): value is ArrayBuffer | Buffer | Uint8Array | Uint8ClampedArray {
   return value instanceof ArrayBuffer || value instanceof Uint8Array || value instanceof Uint8ClampedArray;
}

export function parseResponse(response: ResponseLike): Promise<unknown> {
   if (response.headers.get("Content-Type")?.startsWith("application/json")) {
      return response.json();
   } else if (response.headers.get("Content-Type")?.startsWith("text/plain")) {
      return response.text();
   }

   return response.arrayBuffer();
}

/**
 * Format the request to use in a fetch
 *
 * @param request - The request data
 */
export function resolveRequest(request: InternalRequest): ResolvedRequest {
   let query = "";
   let finalBody: RequestInit["body"];
   let additionalHeaders: Record<string, string> = {};

   if (request.query) {
      // eslint-disable-next-line @typescript-eslint/restrict-template-expressions
      query = `?${request.query}`;
   }

   // Required headers
   const headers: RequestHeaders = {};

   if (request.auth) {
      if (!request.token) {
         throw new Error("Expected token for a request, but wasn't present " + request.fullRoute);
      }

      headers.Authorization = `${request.authPrefix} ${request.token}`;
   }

   if (request.reason?.length) {
      headers["X-Log-Reason"] = encodeURIComponent(request.reason);
   }

   const url = `${request.root}${request.fullRoute}${query}`;

   if (request.files?.length) {
      const formData = new FormData();

      for (const [index, file] of request.files.entries()) {
         const fileKey = file.key ?? `files[${index}]`;

         if (isBufferLike(file.data)) {
            let contentType = file.contentType;
            if (!contentType) {
               const [parsedType] = filetypeinfo(file.data);

               if (parsedType) {
                  contentType = parsedType.mime ?? "application/octet-stream";
               }
            }

            formData.append(fileKey, new Blob([file.data], { type: contentType }), file.name);
         } else {
            formData.append(fileKey, new Blob([`${file.data}`], { type: file.contentType }), file.name);
         }
      }

      if (request.body) {
         if (request.appendToFormData) {
            for (const [key, value] of Object.entries(request.body)) {
               formData.append(key, value);
            }
         } else {
            formData.append("payload_json", JSON.stringify(request.body));
         }
      }

      finalBody = formData;
   } else if (request.body) {
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