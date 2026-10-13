import { createErrorFactory, createHuginnError, createToken, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIPostConnectOAuthProviderResult, CONSTANTS, Errors, Fields } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { env } from "#setup";
import { validateCorrectPassword } from "#utils/validation";

export const postConnectAuthMethod = new Elysia().use(verifyJwt()).post(
   "/api/users/@me/auth-methods/:provider/connect",
   async ({ params: { provider }, body, tokenPayload, status }) => {
      if (provider !== "google" || !env.GOOGLE_CLIENT_ID || !env.GOOGLE_CLIENT_SECRET) return status("Not Implemented");

      if (tokenPayload.authType === "oauth" && Date.now() - tokenPayload.lastAuthenticatedAt > CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW) {
         return status("Forbidden", createErrorFactory(Errors.requireReauthentication()).toObject());
      }
      if (tokenPayload.authType === "password") {
         const passwordError = createErrorFactory(Errors.invalidFormBody());
         if (!body?.password) passwordError.addError("password", Fields.required());
         else {
            const user = await prisma.user.findUniqueOrThrow({ where: { id: BigInt(tokenPayload.id) }, select: { password: true } });
            if (!user.password) passwordError.addError("password", Fields.passwordIncorrect());
            else await validateCorrectPassword(body.password, user.password, passwordError);
         }
         if (passwordError.hasErrors()) return createHuginnError(passwordError, status);
      }

      const existing = await prisma.identityProvider.findFirst({
         where: { userId: BigInt(tokenPayload.id), providerType: provider, completed: true },
      });
      if (existing) return createHuginnError(createErrorFactory(Errors.oauthProviderAlreadyConnected()), status, "Conflict");

      const linkToken = await createToken("oauth-link", { userId: tokenPayload.id, sessionId: tokenPayload.sessionId, purpose: "connect-google" }, "5m");
      return status("OK", { linkToken } satisfies APIPostConnectOAuthProviderResult);
   },
   {
      params: t.Object({ provider: t.Union([t.Literal("google"), t.Literal("github")]) }),
      body: t.Optional(t.Object({ password: t.Optional(t.String()) })),
   },
);
