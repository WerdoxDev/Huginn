import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { type APIGetDevicesResult, type AuthType, type OAuthProvider } from "@huginnjs/shared";
import Elysia from "elysia";

export const getUserDevices = new Elysia().use(verifyJwt()).get("/api/users/@me/devices", async ({ tokenPayload, status }) => {
   const sessions = await prisma.authSession.getUserSessions(tokenPayload.id);

   const result: APIGetDevicesResult = sessions.map((session) => ({
      id: session.id,
      userAgent: session.userAgent,
      deviceName: session.deviceName,
      clientName: session.clientName,
      clientOs: session.clientOs,
      ipAddress: session.ipAddress,
      authType: session.authType as AuthType,
      authProvider: session.authProvider as OAuthProvider | null,
      createdAt: session.createdAt.toISOString(),
      lastSeenAt: session.lastSeenAt.toISOString(),
      current: session.id === tokenPayload.sessionId,
   }));
   return status("OK", result);
});
