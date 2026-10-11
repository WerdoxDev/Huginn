import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { gateway } from "#server";

export const postLogout = new Elysia().use(verifyJwt()).post("/api/auth/logout", async ({ status, tokenPayload }) => {
   await prisma.authSession.updateMany({ where: { id: tokenPayload.sessionId, userId: BigInt(tokenPayload.id) }, data: { revokedAt: new Date() } });
   gateway.revokeAuthSession(tokenPayload.sessionId);
   return status("No Content");
});
