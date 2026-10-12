import { createErrorFactory, createHuginnError, createToken, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIPostConnectOAuthProviderResult, Errors } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { env } from "#setup";

export const postConnectAuthMethod = new Elysia().use(verifyJwt()).post(
   "/api/users/@me/auth-methods/:provider/connect",
   async ({ params: { provider }, tokenPayload, status }) => {
      if (provider !== "google" || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return status("Not Implemented");

      const existing = await prisma.identityProvider.findFirst({
         where: { userId: BigInt(tokenPayload.id), providerType: provider, completed: true },
      });
      if (existing) return createHuginnError(createErrorFactory(Errors.oauthProviderAlreadyConnected()), status, "Conflict");

      const linkToken = await createToken("oauth-link", { userId: tokenPayload.id, sessionId: tokenPayload.sessionId, purpose: "connect-google" }, "5m");
      return status("OK", { linkToken } satisfies APIPostConnectOAuthProviderResult);
   },
   { params: t.Object({ provider: t.Union([t.Literal("google"), t.Literal("github")]) }) },
);
