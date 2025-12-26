import { HTTPError, HuginnAPIError, type HuginnErrorData } from "@huginn/shared";
import type Elysia from "elysia";
import { join } from "pathe";

let _hostname = "";
export async function prepareServer(hostname: string) {
   _hostname = hostname;
   process.env.TEST = JSON.stringify(true);
   await import(join(process.cwd(), "src", "index"));
}

export async function testHandler(
   // app: Elysia,
   path: string,
   headers: Record<string, string>,
   method: "GET" | "POST" | "PATCH" | "PUT" | "DELETE",
   body?: unknown,
   returnAsRaw?: boolean,
): Promise<unknown> {
   let finalBody: unknown;
   const finalHeaders: Record<string, string> = headers;

   if (body && typeof body === "object" && method !== "GET") {
      if (body instanceof FormData) {
         finalBody = body;
      } else {
         finalHeaders["Content-Type"] = "application/json";
         finalBody = JSON.stringify(body);
      }
   }

   await new Promise((r) => setImmediate(r));

   const response = await fetch(new URL(path, _hostname), {
      headers: finalHeaders,
      method,
      // oxlint-disable-next-line no-invalid-fetch-options
      body: finalBody as BodyInit,
      redirect: "manual",
   });

   // const response: Response = await app.handle(
   //    new Request(new URL(path, "http://localhost"), { headers: finalHeaders, method, body: finalBody as BodyInit, redirect: "manual" }),
   // );

   let responseBody: unknown;
   const headersMap = new Map(response.headers);
   if (headersMap.get("content-type")?.startsWith("application/json")) {
      responseBody = await response.json();
   }

   if (response.status >= 200 && response.status < 300) {
      return returnAsRaw ? response : responseBody;
   }

   if (response.status >= 300 && response.status < 400) {
      return response;
   }

   if (response.status >= 400 && response.status < 500) {
      let error: HuginnAPIError;
      try {
         // console.log(responseBody);
         const errorData = responseBody as HuginnErrorData;
         error = new HuginnAPIError(errorData, errorData.code, response.status, method, path, { body });
         // oxlint-disable-next-line no-unused-vars
      } catch (e) {
         throw new HTTPError(response.status, await response.clone().text(), method, path, { body });
      }

      if (error) {
         throw error;
      }
   }

   if (response.status >= 500 && response.status < 600) {
      throw new HTTPError(response.status, await response.clone().text(), method, path, { body });
   }
}
