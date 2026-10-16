import { createSHA265Hash, createToken } from "@huginn/backend-shared";
import { OAuthCode } from "@huginnjs/shared";
import { describe, expect, test } from "bun:test";

import { oauthRedirectUrl, prepareOAuthAuthorization } from "#utils/oauth-flow";

const options = {
   provider: "github" as const,
   flow: "browser" as const,
   redirectUrl: "https://app.huginn.dev/",
   requestUrl: "https://api.huginn.dev/api/auth/github",
   clientId: "test-client",
   authorizeUrl: "https://github.com/login/oauth/authorize",
   scope: "user:email",
};

describe("shared OAuth authorization", () => {
   test("creates state, PKCE, and a provider-bound cookie", async () => {
      const result = await prepareOAuthAuthorization(options);
      expect(result.kind).toBe("redirect");
      if (result.kind !== "redirect" || !result.cookie) throw new Error("Missing OAuth cookie");
      const url = new URL(result.url);
      expect(url.origin).toBe("https://github.com");
      expect(url.searchParams.get("redirect_uri")).toBe("https://api.huginn.dev/api/auth/callback/github");
      expect(url.searchParams.get("state")).toBe(result.cookie.state);
      expect(url.searchParams.get("code_challenge_method")).toBe("S256");
      expect(url.searchParams.get("code_challenge")?.length).toBe(43);
      expect(result.cookie.codeVerifier.length).toBe(43);
      expect(url.searchParams.get("code_challenge")).toBe(createSHA265Hash(result.cookie.codeVerifier, "base64url"));
      expect(result.cookie.provider).toBe("github");
   });

   test("rejects redirects outside the allowed origin", async () => {
      expect((await prepareOAuthAuthorization({ ...options, redirectUrl: "https://evil.test/?next=https://app.huginn.dev/" })).kind).toBe("forbidden");
   });

   test("rejects a link token intended for another provider", async () => {
      const linkToken = await createToken("oauth-link", { userId: "1", sessionId: "2", purpose: "connect-google" }, "5m");
      const result = await prepareOAuthAuthorization({ ...options, linkToken });
      expect(result.kind).toBe("redirect");
      if (result.kind !== "redirect") throw new Error("Missing redirect");
      expect(result.cookie).toBeUndefined();
      expect(new URL(result.url).searchParams.get("error")).toBe(OAuthCode.LINK_EXPIRED);
   });

   test("returns flow and result without retaining old redirect query values", () => {
      const url = new URL(oauthRedirectUrl("https://app.huginn.dev/?old=1", "desktop", { connected: "github" }));
      expect(url.searchParams.get("flow")).toBe("desktop");
      expect(url.searchParams.get("connected")).toBe("github");
      expect(url.searchParams.has("old")).toBe(false);
   });
});
