import { createErrorFactory, createHuginnError, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { Errors } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { gateway } from "#server";

export const deleteAuthMethod = new Elysia().use(verifyJwt()).delete(
   "/api/users/@me/auth-methods/:provider",
   async ({ params: { provider }, tokenPayload, status }) => {
      const userId = BigInt(tokenPayload.id);
      const user = await prisma.user.findUniqueOrThrow({
         where: { id: userId },
         select: { password: true },
      });
      const connected = await prisma.identityProvider.findFirst({
         where: { userId, providerType: provider, completed: true },
      });
      if (!connected) return createHuginnError(createErrorFactory(Errors.oauthProviderNotConnected()), status, "Not Found");

      if (!user.password && provider === "google") {
         return createHuginnError(createErrorFactory(Errors.cannotRemoveLastAuthMethod()), status, "Conflict");
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
   { params: t.Object({ provider: t.Union([t.Literal("google"), t.Literal("github")]) }) },
);
