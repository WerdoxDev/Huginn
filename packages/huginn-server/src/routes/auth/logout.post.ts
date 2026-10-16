import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia from "elysia";

import { gateway } from "#server";

export const postLogout = new Elysia().use(verifyJwt()).post("/api/auth/logout", async ({ status, tokenPayload }) => {
   await prisma.authSession.revokeSession(tokenPayload.sessionId, tokenPayload.id);
   gateway.revokeAuthSession(tokenPayload.sessionId);
   return status("No Content");
});
