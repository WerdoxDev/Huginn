import { createErrorFactory, createHuginnError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, Errors, Fields } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { gateway } from "#server";
import { env } from "#setup";
import { validateCorrectPassword } from "#utils/validation";

export const deleteAuthMethod = new Elysia().use(verifyJwt()).delete(
   "/api/users/@me/auth-methods/:provider",
   async ({ params: { provider }, body, tokenPayload, status }) => {
      if (tokenPayload.authType === "oauth" && Date.now() - tokenPayload.lastAuthenticatedAt > CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW) {
         return status("Forbidden", createErrorFactory(Errors.requireReauthentication()).toObject());
      }
      const userId = BigInt(tokenPayload.id);
      const user = await prisma.user.findUniqueOrThrow({
         where: { id: userId },
         select: { password: true },
      });
      const connected = await prisma.identityProvider.findFirst({
         where: { userId, providerType: provider, completed: true },
      });
      if (!connected) return createHuginnError(createErrorFactory(Errors.oauthProviderNotConnected()), status, "Not Found");

      if (tokenPayload.authType === "password") {
         const passwordError = createErrorFactory(Errors.invalidFormBody());
         if (!body?.password) passwordError.addError("password", Fields.required());
         else if (!user.password) passwordError.addError("password", Fields.passwordIncorrect());
         else await validateCorrectPassword(body.password, user.password, passwordError);
         if (passwordError.hasErrors()) return createHuginnError(passwordError, status);
      }
      if (!user.password) {
         const otherProviders = await prisma.identityProvider.findMany({
            where: { userId, providerType: { not: provider }, completed: true },
            select: { providerType: true },
         });
         const hasOtherAvailableProvider = otherProviders.some(({ providerType }) =>
            providerType === "google"
               ? Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET)
               : providerType === "github" && Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET),
         );
         if (!hasOtherAvailableProvider) return createHuginnError(createErrorFactory(Errors.cannotRemoveLastAuthMethod()), status, "Conflict");
      }

      const [, revokedSessions] = await prisma.$transaction([
         prisma.identityProvider.delete({ where: { id: connected.id } }),
         prisma.authSession.updateManyAndReturn({
            where: { userId, authType: "oauth", authProvider: provider, revokedAt: null },
            data: { revokedAt: new Date() },
            select: { id: true },
         }),
      ]);
      for (const session of revokedSessions) gateway.revokeAuthSession(session.id.toString());
      return status("No Content");
   },
   {
      params: t.Object({ provider: t.Union([t.Literal("google"), t.Literal("github")]) }),
      body: t.Optional(t.Object({ password: t.Optional(t.String()) })),
   },
);
