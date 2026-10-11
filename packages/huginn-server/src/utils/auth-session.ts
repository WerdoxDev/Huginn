import { createToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { CONSTANTS, type AuthType, type Snowflake, type Tokens } from "@huginnjs/shared";
import { createHash, randomUUID } from "node:crypto";

export function hashRefreshToken(token: string): string {
   return createHash("sha256").update(token).digest("hex");
}

export async function createAuthSession(userId: Snowflake, authType: AuthType, userAgent?: string): Promise<Tokens> {
   const sessionId = randomUUID();
   const lastAuthenticatedAt = Date.now();
   const payload = { id: userId, sessionId, authType, lastAuthenticatedAt };
   const [token, refreshToken] = await Promise.all([
      createToken("user-access", payload, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME),
      createToken("user-refresh", { ...payload, tokenId: randomUUID() }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME),
   ]);

   await prisma.authSession.create({
      data: {
         id: sessionId,
         userId: BigInt(userId),
         refreshTokenHash: hashRefreshToken(refreshToken),
         authType,
         authenticatedAt: new Date(lastAuthenticatedAt),
         userAgent: userAgent?.slice(0, 512) ?? null,
         expiresAt: new Date(lastAuthenticatedAt + CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME_MS),
      },
   });

   return { token, refreshToken };
}

export async function rotateAuthSession(
   sessionId: string,
   userId: Snowflake,
   oldRefreshToken: string,
   authType: AuthType,
   lastAuthenticatedAt: number,
): Promise<Tokens | null> {
   const now = new Date();
   const payload = { id: userId, sessionId, authType, lastAuthenticatedAt };
   const [token, refreshToken] = await Promise.all([
      createToken("user-access", payload, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME),
      createToken("user-refresh", { ...payload, tokenId: randomUUID() }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME),
   ]);

   const result = await prisma.authSession.updateMany({
      where: {
         id: sessionId,
         userId: BigInt(userId),
         authType,
         refreshTokenHash: hashRefreshToken(oldRefreshToken),
         revokedAt: null,
         expiresAt: { gt: now },
      },
      data: { refreshTokenHash: hashRefreshToken(refreshToken), lastSeenAt: now, expiresAt: new Date(now.getTime() + CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME_MS) },
   });

   return result.count === 1 ? { token, refreshToken } : null;
}
