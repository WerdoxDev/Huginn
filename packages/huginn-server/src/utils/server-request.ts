import { envs } from "#setup";
import { createToken } from "@huginn/backend-shared";
import { logCDNRequest } from "@huginn/runtime-shared";
import {
   HTTPError,
   type InternalRequest,
   type RequestData,
   type RequestMethod,
   type RouteLike,
   constants,
   parseResponse,
   resolveRequest,
} from "@huginn/shared";

export async function cdnUpload<T>(fullRoute: RouteLike, options: RequestData = {}) {
   if (!envs.CDN_LOCAL_URL) {
      throw new Error("CDN Root was not configured");
   }

   const token = await createToken("cdn", undefined, constants.CDN_TOKEN_EXPIRE_TIME);

   logCDNRequest(fullRoute, "POST");
   return (await request({
      ...options,
      root: envs.CDN_LOCAL_URL,
      method: "POST",
      fullRoute,
      throw: true,
      headers: { ...options.headers, Authorization: `Bearer ${token}` },
   })) as Promise<T>;
}

export async function serverFetch<T>(url: string, method: RequestMethod, options: RequestData & { throw?: boolean }) {
   const fullUrl = new URL(url);
   return (await request({
      ...options,
      root: fullUrl.origin,
      fullRoute: fullUrl.pathname as `/${string}`,
      method,
      token: options.token,
      auth: options.token !== undefined,
      authPrefix: "Bearer",
   })) as Promise<T>;
}

export async function request(options: InternalRequest & { throw?: boolean }): Promise<unknown> {
   const { url, fetchOptions } = await resolveRequest(options);
   console.log(fetchOptions);
   const response = await fetch(url, fetchOptions);

   if (response.ok || !options.throw) return parseResponse(response);

   if (response.status >= 400 && response.status < 600) {
      throw new HTTPError(response.status, response.statusText, options.method, url, fetchOptions);
   }

   return response;
}
