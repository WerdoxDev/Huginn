import { describe, expect, it } from "vitest";

import { HuginnClient } from "../huginn-client";

describe("dynamicMakeURL()", () => {
   it("should resolve a CDN gif request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.dynamicMakeURL("/test", "a_123", { size: 128 });
      expect(url).toBe("https://test.com/test.gif?size=128");
   });

   it("should force a static format if forceStatic is true", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.dynamicMakeURL("/test", "a_123", { size: 128, forceStatic: true });
      expect(url).toBe("https://test.com/test.webp?size=128");
   });
});

describe("makeURL()", () => {
   it("should resolve a CDN request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.makeURL("/test", { size: 128, format: "png" });
      expect(url).toBe("https://test.com/test.png?size=128");
   });

   it("should throw an error if an invalid format is provided", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });
      expect(() => client.cdn.makeURL("/test", { format: "invalid" as any })).toThrow();
   });

   it("should throw an error if an invalid size is provided", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });
      expect(() => client.cdn.makeURL("/test", { format: "png", size: -1 as any })).toThrow();
   });
});

describe("avatar()", () => {
   it("should resolve a CDN avatar request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.avatar("123", "a_123", { size: 128 });
      expect(url).toBe("https://test.com/avatars/123/a_123.gif?size=128");
   });
});

describe("banner()", () => {
   it("should resolve a CDN banner request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.banner("123", "a_123", { size: 128 });
      expect(url).toBe("https://test.com/banners/123/a_123.gif?size=128");
   });
});

describe("channelIcon()", () => {
   it("should resolve a CDN channel icon request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.channelIcon("123", "a_123", { size: 128 });
      expect(url).toBe("https://test.com/channel-icons/123/a_123.gif?size=128");
   });
});

describe("emoji()", () => {
   it("should resolve a CDN emoji request url", async () => {
      const client = new HuginnClient({ cdn: { url: "https://test.com" } });

      const url = client.cdn.emoji("123");
      expect(url).toBe("https://test.com/emoji/123.svg");
   });
});
