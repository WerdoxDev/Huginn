import { afterEach, describe, expect, it, vi } from "vitest";

import {
   changeCdnUrlBase,
   defaultInstanceUrls,
   fetchInstanceUrls,
   normalizeAccessAddress,
   switchInstanceTokens,
   tryAccessAddresses,
} from "./instances";

const first = "https://first.example";
const second = "https://second.example";
afterEach(() => {
   vi.unstubAllGlobals();
   vi.useRealTimers();
});

describe("instance access addresses", () => {
   it("builds API and WebSocket URLs from one address", () => {
      expect(defaultInstanceUrls(first)).toMatchObject({
         api: `${first}/api`,
         gateway: "wss://first.example/gateway",
         cdn: `${first}/cdn`,
         voice: "wss://first.example/voice",
      });
      expect(() => normalizeAccessAddress(`${first}/api`)).toThrow();
   });
   it("uses a custom CDN path", () => {
      expect(changeCdnUrlBase("https://first.example/cdn/avatars/1.png?size=64", "https://second.example/assets")).toBe(
         "https://second.example/assets/avatars/1.png?size=64",
      );
   });
   it("uses only the selected address overrides", async () => {
      vi.stubGlobal(
         "fetch",
         vi.fn().mockResolvedValue({ ok: true, json: async () => ({ instanceId: "shared", urls: defaultInstanceUrls(second) }) }),
      );
      const result = await fetchInstanceUrls(second, {
         id: "one",
         name: "One",
         serverId: "shared",
         accessAddresses: [first, second],
         endpointOverrides: { [first]: { cdn: "https://cdn-first.example/cdn" }, [second]: { cdn: "https://cdn-second.example/cdn" } },
      });
      expect(result.urls.cdn).toBe("https://cdn-second.example/cdn");
      expect(result.urls.api).toBe(`${second}/api`);
   });
   it("rejects a different instance", async () => {
      vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: true, json: async () => ({ instanceId: "other", urls: defaultInstanceUrls(second) }) }));
      await expect(fetchInstanceUrls(second, { id: "one", name: "One", serverId: "shared", accessAddresses: [first, second] })).rejects.toThrow(
         "different instance",
      );
   });
   it("uses manual API and gateway when discovery is unavailable", async () => {
      vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
      const result = await fetchInstanceUrls(first, {
         id: "one",
         name: "One",
         accessAddresses: [first],
         endpointOverrides: { [first]: { api: `${second}/api`, gateway: "wss://second.example/gateway" } },
      });
      expect(result.urls.api).toBe(`${second}/api`);
      expect(result.urls.gateway).toBe("wss://second.example/gateway");
   });
   it("retries A before selecting B", async () => {
      vi.useFakeTimers();
      const connect = vi.fn(async (address: string) => {
         if (address === first) throw new Error("unreachable");
         return "connected";
      });
      const result = tryAccessAddresses({ id: "one", name: "One", accessAddresses: [first, second] }, first, connect);
      await vi.advanceTimersByTimeAsync(750);
      await expect(result).resolves.toEqual({ address: second, value: "connected" });
      expect(connect.mock.calls.map(([address]) => address)).toEqual([first, first, second]);
   });
   it("keeps tokens separate across instances", () => {
      localStorage.setItem("access-token", "first-token");
      switchInstanceTokens("first", "second");
      expect(localStorage.getItem("access-token")).toBeNull();
      localStorage.setItem("access-token", "second-token");
      switchInstanceTokens("second", "first");
      expect(localStorage.getItem("access-token")).toBe("first-token");
   });
});
