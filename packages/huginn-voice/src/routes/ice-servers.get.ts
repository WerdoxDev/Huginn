import { verifyJwt } from "@huginn/backend-shared";
import { CONSTANTS } from "@huginnjs/shared";
import Elysia from "elysia";

import { env } from "#env";
import { isIceServersResult } from "#utils/turn-credentials";

export const getIceServers = new Elysia().use(verifyJwt()).get("/voice/ice-servers", async ({ status }) => {
   const id = env.CLOUDFLARE_TURN_ID;
   const token = env.CLOUDFLARE_TURN_TOKEN;
   if (!id || !token) return status("OK", { iceServers: [] });

   const response = await fetch(`https://rtc.live.cloudflare.com/v1/turn/keys/${encodeURIComponent(id)}/credentials/generate-ice-servers`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ ttl: 86400 }),
      signal: AbortSignal.timeout(CONSTANTS.TURN_CREDENTIAL_TIMEOUT_MS),
   });
   if (!response.ok) return status("Internal Server Error");

   const data: unknown = await response.json();
   if (!isIceServersResult(data)) return status("Internal Server Error");
   return status("OK", data);
});
