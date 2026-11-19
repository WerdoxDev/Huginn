import { describe, expect, test } from "bun:test";

import { resolveCdnUrl } from "./cdn-utils";

describe("resolveCdnUrl", () => {
   test.each([
      "gifs/123.gif",
      "/gifs/123.gif",
      "cdn/gifs/123.gif",
      "/cdn/gifs/123.gif",
      "https://old.example/cdn/gifs/123.gif",
      "//old.example/cdn/gifs/123.gif",
   ])("resolves %s against the selected CDN", (value) => {
      expect(resolveCdnUrl(value, "https://current.example/cdn")).toBe("https://current.example/cdn/gifs/123.gif");
   });

   test.each(["https://current.example/media", "https://current.example/media/"])("handles custom CDN prefixes and trailing slashes: %s", (base) => {
      for (const value of ["gifs/123.gif", "/gifs/123.gif", "/cdn/gifs/123.gif", "/media/gifs/123.gif", "https://old.example/media/gifs/123.gif"]) {
         expect(resolveCdnUrl(value, base)).toBe("https://current.example/media/gifs/123.gif");
      }
   });

   test("removes a configured nested prefix before checking the legacy /cdn prefix", () => {
      expect(resolveCdnUrl("https://old.example/cdn/assets/gifs/123.gif", "https://current.example/cdn/assets/")).toBe(
         "https://current.example/cdn/assets/gifs/123.gif",
      );
   });

   test("matches path prefixes only at segment boundaries", () => {
      expect(resolveCdnUrl("/cdn-backup/gifs/123.gif", "https://current.example/cdn")).toBe("https://current.example/cdn/cdn-backup/gifs/123.gif");
      expect(resolveCdnUrl("/media-backup/gifs/123.gif", "https://current.example/media")).toBe("https://current.example/media/media-backup/gifs/123.gif");
   });

   test("supports CDNs served from the origin root", () => {
      expect(resolveCdnUrl("/cdn/gifs/123.gif", "https://current.example/")).toBe("https://current.example/gifs/123.gif");
   });

   test("keeps signatures, query ordering, repeated parameters, and fragments intact", () => {
      const query = "?ex=123&hm=abc%2fdef&tag=one&tag=two&q=a+b#preview";
      expect(resolveCdnUrl(`https://old.example/cdn/attachments/1/2/cat%20dance.gif${query}`, "https://current.example/media")).toBe(
         `https://current.example/media/attachments/1/2/cat%20dance.gif${query}`,
      );
   });

   test("preserves encoded external proxy URLs", () => {
      const path = "external/https%3A%2F%2Foutside.example%2Fcdn%2Fcat.gif%3Fname%3Da%2Bb";
      expect(resolveCdnUrl(`/${path}`, "https://current.example/media/")).toBe(`https://current.example/media/${path}`);
   });

   test.each(["data:image/gif;base64,R0lGODlh", "blob:https://old.example/id", "file:///tmp/cat.gif", "https://["])(
      "preserves unsupported or invalid input: %s",
      (value) => {
         expect(resolveCdnUrl(value, "https://current.example/cdn")).toBe(value);
      },
   );

   test("preserves the input when the CDN base is invalid", () => {
      expect(resolveCdnUrl("gifs/123.gif", "invalid base")).toBe("gifs/123.gif");
      expect(resolveCdnUrl("gifs/123.gif", "file:///tmp/")).toBe("gifs/123.gif");
   });
});
