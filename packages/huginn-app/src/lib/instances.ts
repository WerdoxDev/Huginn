import type { InstanceProfile, InstanceUrls } from "@/types";

export function normalizeAccessAddress(value: string): string {
   const url = new URL(value.trim());
   if (!["http:", "https:"].includes(url.protocol) || url.username || url.password || url.pathname !== "/" || url.search || url.hash) {
      throw new Error("Enter an HTTP or HTTPS origin without a path");
   }
   return url.origin;
}

export function defaultInstanceUrls(address: string): InstanceUrls {
   const origin = normalizeAccessAddress(address);
   const socketOrigin = origin.replace(/^http/, "ws");
   return {
      api: `${origin}/api`,
      gateway: `${socketOrigin}/gateway`,
      cdn: `${origin}/cdn`,
      voice: `${socketOrigin}/voice`,
      posthog: "https://e.huginn.dev",
      otlp: "https://otlp.huginn.dev",
   };
}

export function changeCdnUrlBase(value: string, cdnBase: string): string {
   try {
      const original = new URL(value, cdnBase);
      const target = new URL(cdnBase);
      const path = original.pathname.replace(/^\/cdn\/?/, "").replace(/^\/+/, "");
      target.pathname = `${target.pathname.replace(/\/$/, "")}/${path}`;
      target.search = original.search;
      target.hash = original.hash;
      return target.toString();
   } catch {
      return value;
   }
}

export function switchInstanceTokens(fromId: string, toId: string): void {
   if (fromId === toId) return;
   const current = { access: localStorage.getItem("access-token"), refresh: localStorage.getItem("refresh-token") };
   localStorage.setItem(`instance-auth:${fromId}`, JSON.stringify(current));
   const saved = localStorage.getItem(`instance-auth:${toId}`);
   let next: typeof current = { access: null, refresh: null };
   try {
      if (saved) next = JSON.parse(saved);
   } catch {
      /* Start a fresh session. */
   }
   for (const [key, value] of [
      ["access-token", next.access],
      ["refresh-token", next.refresh],
   ] as const) {
      if (value) localStorage.setItem(key, value);
      else localStorage.removeItem(key);
   }
}

export async function tryAccessAddresses<T>(
   instance: InstanceProfile,
   preferredAddress: string,
   connect: (address: string) => Promise<T>,
): Promise<{ address: string; value: T }> {
   const addresses = [preferredAddress, ...instance.accessAddresses].filter(
      (address, index, all) => address && instance.accessAddresses.includes(address) && all.indexOf(address) === index,
   );
   let lastError: unknown;
   for (const address of addresses) {
      for (let attempt = 0; attempt < 2; attempt++) {
         try {
            return { address, value: await connect(address) };
         } catch (cause) {
            lastError = cause;
            if (attempt === 0) await new Promise((resolve) => setTimeout(resolve, 750));
         }
      }
   }
   throw lastError ?? new Error("No access address is available");
}

export function validateInstanceUrls(value: unknown): InstanceUrls {
   if (!value || typeof value !== "object") throw new Error("Invalid instance URLs");
   const urls = value as Record<string, unknown>;
   const normalized: Record<string, string> = {};
   for (const key of ["api", "gateway", "cdn", "voice", "posthog", "otlp"] as const) {
      if (typeof urls[key] !== "string") throw new Error(`Missing ${key} URL`);
      const url = new URL(urls[key]);
      const socket = key === "gateway" || key === "voice";
      if (
         url.username ||
         url.password ||
         url.search ||
         url.hash ||
         !(socket ? ["ws:", "wss:"].includes(url.protocol) : ["http:", "https:"].includes(url.protocol))
      ) {
         throw new Error(`Invalid ${key} URL`);
      }
      normalized[key] = url.href.replace(/\/+$/, "");
   }
   return normalized as InstanceUrls;
}

export async function fetchInstanceUrls(address: string, instance: InstanceProfile): Promise<{ serverId?: string; urls: InstanceUrls }> {
   const normalized = normalizeAccessAddress(address);
   const manual = instance.endpointOverrides?.[normalized];
   let response: Response;
   try {
      response = await fetch(`${normalized}/api/instance`, { cache: "no-store", signal: AbortSignal.timeout(7000) });
   } catch (cause) {
      if (manual?.api && manual.gateway) return { urls: validateInstanceUrls({ ...defaultInstanceUrls(normalized), ...manual }) };
      if (!instance.legacyExternalUrl || new URL(instance.legacyExternalUrl).origin !== normalized) throw cause;
      return await fetchLegacyInstanceUrls(instance.legacyExternalUrl, normalized, instance);
   }
   if (!response.ok) {
      if (manual?.api && manual.gateway) return { urls: validateInstanceUrls({ ...defaultInstanceUrls(normalized), ...manual }) };
      if (instance.legacyExternalUrl && new URL(instance.legacyExternalUrl).origin === normalized) {
         return await fetchLegacyInstanceUrls(instance.legacyExternalUrl, normalized, instance);
      }
      throw new Error(`Instance discovery returned ${response.status}`);
   }
   const body = await response.json();
   if (!body || typeof body.instanceId !== "string" || !body.instanceId) throw new Error("Missing instance ID");
   if (instance.serverId && instance.serverId !== body.instanceId) throw new Error("This address belongs to a different instance");
   return { serverId: body.instanceId, urls: validateInstanceUrls({ ...body.urls, ...manual }) };
}

async function fetchLegacyInstanceUrls(configUrl: string, address: string, instance: InstanceProfile): Promise<{ urls: InstanceUrls }> {
   const response = await fetch(configUrl, { cache: "no-store", signal: AbortSignal.timeout(7000) });
   if (!response.ok) throw new Error(`Legacy discovery returned ${response.status}`);
   const body = await response.json();
   if (!body?.api || !body?.cdn || !body?.voice) throw new Error("Invalid legacy discovery response");
   const api = normalizeAccessAddress(body.api);
   const cdn = normalizeAccessAddress(body.cdn);
   const voice = normalizeAccessAddress(body.voice);
   return {
      urls: validateInstanceUrls({
         ...defaultInstanceUrls(address),
         api: `${api}/api`,
         gateway: `${api.replace(/^http/, "ws")}/gateway`,
         cdn: `${cdn}/cdn`,
         voice: `${voice.replace(/^http/, "ws")}/voice`,
         ...instance.endpointOverrides?.[address],
      }),
   };
}

export async function probeInstanceUrls(urls: InstanceUrls): Promise<void> {
   const response = await fetch(urls.api, { cache: "no-store", signal: AbortSignal.timeout(7000) });
   if (response.status >= 500) throw new Error("API unavailable");
   await new Promise<void>((resolve, reject) => {
      const socket = new WebSocket(urls.gateway);
      const timeout = setTimeout(() => finish(false), 7000);
      let done = false;
      function finish(success: boolean) {
         if (done) return;
         done = true;
         clearTimeout(timeout);
         socket.close();
         if (success) resolve();
         else reject(new Error("Gateway unavailable"));
      }
      socket.onopen = () => finish(true);
      socket.onerror = () => finish(false);
      socket.onclose = () => finish(false);
   });
}
