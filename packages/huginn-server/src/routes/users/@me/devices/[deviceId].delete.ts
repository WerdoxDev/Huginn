import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import Elysia, { t } from "elysia";

import { gateway } from "#server";

export const deleteDevice = new Elysia().use(verifyJwt()).delete(
   "/api/users/@me/devices/:deviceId",
   async ({ tokenPayload, params: { deviceId }, status }) => {
      const result = await prisma.authSession.updateMany({
         where: { id: deviceId, userId: BigInt(tokenPayload.id), revokedAt: null },
         data: { revokedAt: new Date() },
      });
      if (!result.count) return status("Not Found");
      gateway.revokeAuthSession(deviceId);
      return status("No Content");
   },
   { params: t.Object({ deviceId: t.String({ format: "uuid" }) }) },
);
