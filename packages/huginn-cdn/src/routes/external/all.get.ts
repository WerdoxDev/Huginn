import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { analytics, CONSTANTS, Errors } from "@huginnjs/shared";
import Elysia from "elysia";

import { version } from "../../../package.json";

function isBlockedHost(hostname: string) {
   return CONSTANTS.CDN_EXTERNAL_PRIVATE_HOST_PATTERNS.some((re) => re.test(hostname));
}

export const getAllExternal = new Elysia().get("/cdn/external/*", async ({ params, status }) => {
   const span = analytics.getActiveSpan();

   const target = decodeURIComponent(params["*"] ?? "");

   span?.setAttribute("params.target", target);

   const url = new URL(target);
   if (!["http:", "https:"].includes(url.protocol)) {
      return createHuginnError(createErrorFactory(Errors.invalidUrlProtocol()), status);
   }
   if (isBlockedHost(url.hostname)) {
      return createHuginnError(createErrorFactory(Errors.hostNotAllowed()), status);
   }

   const controller = new AbortController();
   const timeout = setTimeout(() => controller.abort(), 10000);

   let upstream: Response;
   try {
      upstream = await fetch(url.toString(), { signal: controller.signal, redirect: "follow", headers: { "User-Agent": `huginn-cdn-proxy/${version}` } });
   } catch {
      return createHuginnError(createErrorFactory(Errors.upstreamFetchFailed()), status);
   } finally {
      clearTimeout(timeout);
   }

   const contentType = upstream.headers.get("Content-Type") ?? "";
   if (!CONSTANTS.CDN_EXTERNAL_ALLOWED_CONTENT_TYPES.some((x) => contentType.startsWith(x))) {
      return createHuginnError(createErrorFactory(Errors.unsupportedContentType()), status);
   }

   const length = upstream.headers.get("Content-Length");
   if (length && Number(length) > CONSTANTS.CDN_EXTERNAL_MAX_FILE_SIZE) {
      return createHuginnError(createErrorFactory(Errors.fileTooLarge(Number(length), CONSTANTS.CDN_EXTERNAL_MAX_FILE_SIZE)), status);
   }

   return new Response(upstream.body, { headers: { "Content-Type": contentType } });
});
