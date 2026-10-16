import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { gateway } from "#server";

export const deleteUserDevice = new Elysia().use(verifyJwt()).delete(
   "/api/users/@me/devices/:sessionId",
   async ({ tokenPayload, params: { sessionId }, status }) => {
      const result = await prisma.authSession.revokeSession(sessionId, tokenPayload.id);

      if (!result) return status("Not Found");
      gateway.revokeAuthSession(sessionId);

      return status("No Content");
   },
   { params: t.Object({ sessionId: t.String() }) },
);
