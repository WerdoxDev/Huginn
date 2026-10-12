import type { Snowflake } from "@huginnjs/shared";

import { prisma } from "@huginn/backend-shared/database";

export async function isActiveOAuthLinkSession(userId: Snowflake, sessionId: Snowflake) {
   return Boolean(
      await prisma.authSession.findFirst({
         where: { id: BigInt(sessionId), userId: BigInt(userId), revokedAt: null, expiresAt: { gt: new Date() } },
         select: { id: true },
      }),
   );
}
