import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIGetDevicesResult, type AuthType } from "@huginnjs/shared";
import Elysia from "elysia";

export const getDevices = new Elysia().use(verifyJwt()).get("/api/users/@me/devices", async ({ tokenPayload, status }) => {
   const sessions = await prisma.authSession.findMany({
      where: { userId: BigInt(tokenPayload.id), revokedAt: null, expiresAt: { gt: new Date() } },
      orderBy: { lastSeenAt: "desc" },
      select: { id: true, userAgent: true, deviceName: true, authType: true, createdAt: true, lastSeenAt: true },
   });

   const result: APIGetDevicesResult = sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      deviceName: session.deviceName,
      authType: session.authType as AuthType,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      current: session.id === tokenPayload.sessionId,
   }));
   return status("OK", result);
});
