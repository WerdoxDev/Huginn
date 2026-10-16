import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, type Snowflake } from "@huginnjs/shared";

export async function isActiveOAuthLinkSession(userId: Snowflake, sessionId: Snowflake) {
   const session = await prisma.authSession.findFirst({
      where: { id: BigInt(sessionId), userId: BigInt(userId), revokedAt: null, expiresAt: { gt: new Date() } },
      select: { authType: true, authenticatedAt: true },
   });
   return Boolean(session && (session.authType !== "oauth" || Date.now() - session.authenticatedAt.getTime() <= CONSTANTS.OAUTH_SENSITIVE_REAUTH_WINDOW));
}
