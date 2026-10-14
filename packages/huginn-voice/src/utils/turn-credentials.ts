import { type APIGetIceServersResult } from "@huginnjs/shared";

export function isIceServersResult(data: unknown): data is APIGetIceServersResult {
   if (!data || typeof data !== "object" || !("iceServers" in data) || !Array.isArray(data.iceServers)) return false;
   return data.iceServers.every((server) => {
      if (!server || typeof server !== "object" || !("urls" in server)) return false;
      const urls = typeof server.urls === "string" ? [server.urls] : server.urls;
      return Array.isArray(urls) && urls.every((url) => typeof url === "string");
   });
}
