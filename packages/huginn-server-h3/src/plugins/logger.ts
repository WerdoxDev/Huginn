import { logRequest, logResponse } from "@huginn/backend-shared";

export default defineNitroPlugin(nitro => {
   nitro.hooks.hook("beforeResponse", (event, response) => {
      const status = getResponseStatus(event);
      if (status >= 200 && status < 300) {
         logResponse(event.path, status, response?.body);
      }
   });
   nitro.hooks.hook("request", async event => {
      logRequest(event.path, event.method, event.method !== "GET" ? await readBody(event) : undefined);
   });
});
