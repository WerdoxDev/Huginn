import { testHandler } from "@huginn/backend-shared";
import { describe, expect, test } from "bun:test";

describe("GET /auth/google", () => {
   test("should return '404' when query params are not correct", async () => {
      const result = testHandler("/api/auth/google", {}, "GET");
      expect(result).rejects.toThrow("Invalid Form Body");
   });

   test("rejects a redirect whose origin is not allowed, even if its URL contains an allowed origin", async () => {
      const result = testHandler(
         `/api/auth/google?${new URLSearchParams({ redirect_url: "https://invalid.com/?next=https://app.huginn.dev/", flow: "browser" }).toString()}`,
         {},
         "GET",
      );
      expect(result).rejects.toThrow("Forbidden");
   });

   test("uses server-generated state and PKCE for an allowed redirect", async () => {
      const result = (await testHandler(
         `/api/auth/google?${new URLSearchParams({ redirect_url: "https://app.huginn.dev/", flow: "browser" }).toString()}`,
         {},
         "GET",
         true,
      )) as Response;

      expect(result.status).toBe(302);
      const location = new URL(result.headers.get("location")!);
      expect(location.origin).toBe("https://accounts.google.com");
      expect(location.searchParams.get("state")?.length).toBeGreaterThan(32);
      expect(location.searchParams.get("code_challenge_method")).toBe("S256");
      expect(location.searchParams.get("code_challenge")?.length).toBeGreaterThan(32);
   });
});
