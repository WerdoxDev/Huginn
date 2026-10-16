import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIGetAuthMethodsResult } from "@huginnjs/shared";
import Elysia from "elysia";

import { env } from "#setup";

export const getAuthMethods = new Elysia().use(verifyJwt()).get("/api/users/@me/auth-methods", async ({ tokenPayload, status }) => {
   const user = await prisma.user.findUniqueOrThrow({
      where: { id: BigInt(tokenPayload.id) },
      select: {
         password: true,
         identityProvider: {
            where: { completed: true },
            select: { providerType: true, accountIdentifier: true },
         },
      },
   });

   const connected = new Map(user.identityProvider.map((identity) => [identity.providerType, identity.accountIdentifier]));
   const result: APIGetAuthMethodsResult = {
      password: { configured: user.password !== null },
      providers: [
         {
            type: "google",
            connected: connected.has("google"),
            available: Boolean(env.GOOGLE_CLIENT_ID && env.GOOGLE_CLIENT_SECRET),
            accountIdentifier: connected.get("google") ?? null,
         },
         { type: "github", connected: connected.has("github"), available: Boolean(env.GITHUB_CLIENT_ID && env.GITHUB_CLIENT_SECRET), accountIdentifier: connected.get("github") ?? null },
      ],
   };

   return status("OK", result);
});
