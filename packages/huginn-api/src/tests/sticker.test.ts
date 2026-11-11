import type { APISticker } from "@huginnjs/shared";

import { describe, expect, it, vi } from "vitest";

import type { REST } from "../rest";

import { CDN } from "../cdn";
import { StickerAPI } from "../rest-apis/sticker";

describe("StickerAPI", () => {
   const sticker: APISticker = { source: "custom", id: "123", title: "Wave", width: 20, height: 20, src: "stickers/123.webp", url: "stickers/123.webp" };
   function setup() {
      const rest = { get: vi.fn(), post: vi.fn(), delete: vi.fn() };
      return { rest, api: new StickerAPI(rest as unknown as REST, new CDN({ url: "https://cdn.example/cdn" })) };
   }

   it("sends search terms and pagination as query parameters", async () => {
      const { api, rest } = setup();
      rest.get.mockResolvedValue([]);
      await api.search("cats & dogs", 24, 2);
      const [route, options] = rest.get.mock.calls[0];
      expect(route).toBe("/stickers/search");
      expect(options.auth).toBe(true);
      expect(options.query.get("query")).toBe("cats & dogs");
      expect(options.query.get("page")).toBe("2");
   });

   it("resolves uploaded stickers through the configured CDN", async () => {
      const { api, rest } = setup();
      rest.get.mockResolvedValue([sticker]);
      expect((await api.getMine("wave"))[0].src).toBe("https://cdn.example/cdn/stickers/123.webp");
      expect(rest.get.mock.calls[0][1].query.get("query")).toBe("wave");
   });

   it("uploads files with multipart fields and resolves the returned asset", async () => {
      const { api, rest } = setup();
      rest.post.mockResolvedValue(sticker);
      const file = { data: new ArrayBuffer(2), name: "wave.gif", contentType: "image/gif" };
      expect((await api.upload(file, "Wave")).src).toBe("https://cdn.example/cdn/stickers/123.webp");
      expect(rest.post).toHaveBeenCalledWith("/stickers", { auth: true, files: [file], body: { title: "Wave" }, appendToFormData: true });
   });
});
