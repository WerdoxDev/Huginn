import { ResponseLike } from "@shared/rest-types";
import { RESTOptions } from "../types";

export const DefaultRestOptions: Required<RESTOptions> = {
   api: "http://localhost:3000",
   authPrefix: "Bearer",
   async makeRequest(...args): Promise<ResponseLike> {
      return defaultMakeRequest(...args);
   },
} as const;

export async function defaultMakeRequest(url: string, init: RequestInit): Promise<ResponseLike> {
   const response = await fetch(url, init);

   return {
      body: response.body,
      async arrayBuffer() {
         return response.arrayBuffer();
      },
      async json() {
         return response.json();
      },
      async text() {
         return response.text();
      },
      get bodyUsed() {
         return response.bodyUsed;
      },
      headers: response.headers,
      status: response.status,
      statusText: response.statusText,
      ok: response.status >= 200 && response.status < 300,
   };
}
