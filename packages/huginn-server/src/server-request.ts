import { HTTPError, InternalRequest, parseResponse, RequestData, RequestMethod, resolveRequest, RouteLike } from "@huginn/shared";
import { cdnRoot } from ".";

export async function cdnUpload(fullRoute: RouteLike, options: RequestData = {}) {
   if (!cdnRoot) {
      throw new Error("CDN Root was not configured");
   }

   return await request({ ...options, root: cdnRoot, method: RequestMethod.POST, fullRoute });
}

export async function request(options: InternalRequest): Promise<unknown> {
   const { url, fetchOptions } = resolveRequest(options);

   const response = await fetch(url, fetchOptions);

   if (response.ok) return parseResponse(response);

   if (response.status >= 500 && response.status < 600) {
      throw new HTTPError(response.status, response.statusText, options.method, url, fetchOptions);
   }

   return response;
}
