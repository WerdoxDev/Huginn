import { describe, expect, test } from "bun:test";

import { signCdnPath, verifyCdnSignature } from "../cdn-signature";

describe("CDN signatures", () => {
   const secret = "test-cdn-secret";

   test("protects the exact asset path, expiry, and secret", () => {
      const path = "gifs/123.gif";
      const expiration = Math.floor(Date.now() / 1000) + 60;
      const url = new URL(signCdnPath(path, secret, expiration), "https://cdn.example/");
      const signature = url.searchParams.get("hm")!;
      expect(verifyCdnSignature(path, expiration, signature, secret)).toBe(true);
      expect(verifyCdnSignature("gifs/456.gif", expiration, signature, secret)).toBe(false);
      expect(verifyCdnSignature(path, expiration + 1, signature, secret)).toBe(false);
      expect(verifyCdnSignature(path, expiration, signature, "wrong-secret")).toBe(false);
   });

   test("rejects expired, malformed, and non-integer signatures without throwing", () => {
      const now = Math.floor(Date.now() / 1000);
      const signed = new URL(signCdnPath("attachments/1/2/a.gif", secret, now), "https://cdn.example/");
      expect(verifyCdnSignature("attachments/1/2/a.gif", now, signed.searchParams.get("hm")!, secret)).toBe(false);
      for (const signature of ["", "a", "z".repeat(64), "a".repeat(65)]) {
         expect(verifyCdnSignature("gifs/1.gif", now + 60, signature, secret)).toBe(false);
      }
      expect(verifyCdnSignature("gifs/1.gif", now + 60.5, "a".repeat(64), secret)).toBe(false);
   });
});
