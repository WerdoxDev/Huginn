import { createToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { analytics, CONSTANTS, snowflake, WorkerID, type AuthType, type OAuthProvider, type Snowflake, type Tokens } from "@huginnjs/shared";
import { randomUUID } from "node:crypto";

export function hashRefreshToken(token: string): string {
   return new Bun.CryptoHasher("sha256").update(token).digest("hex");
}

export async function createAuthSession(userId: Snowflake, authType: AuthType, authProvider?: OAuthProvider, userAgent?: string): Promise<Tokens> {
   return analytics.startActiveSpan("db.authSession.createAuthSession", async (span) => {
      span.setAttributes({
         "query.user.id": userId.toString(),
         "query.authType": authType,
      });

      const sessionId = snowflake.generate(WorkerID.AUTH);
      const lastAuthenticatedAt = Date.now();
      const payload = { id: userId, sessionId: sessionId.toString(), authType, authProvider, lastAuthenticatedAt };
      const [token, refreshToken] = await Promise.all([
         createToken("user-access", payload, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME),
         createToken("user-refresh", { ...payload, tokenId: randomUUID() }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME),
      ]);

      span.setAttributes({
         "auth_session.id": sessionId.toString(),
         "auth_session.lastAuthenticatedAt": lastAuthenticatedAt,
      });

      await prisma.authSession.create({
         data: {
            id: sessionId,
            userId: BigInt(userId),
            refreshTokenHash: hashRefreshToken(refreshToken),
            authType,
            authProvider: authProvider ?? null,
            authenticatedAt: new Date(lastAuthenticatedAt),
            userAgent: userAgent?.slice(0, 512) ?? null,
            expiresAt: new Date(lastAuthenticatedAt + CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME_MS),
         },
      });

      return { token, refreshToken };
   });
}

export async function rotateAuthSession(
   sessionId: Snowflake,
   userId: Snowflake,
   oldRefreshToken: string,
   authType: AuthType,
   lastAuthenticatedAt: number,
): Promise<Tokens | null> {
   return analytics.startActiveSpan("db.authSession.rotateAuthSession", async (span) => {
      span.setAttributes({
         "query.session.id": sessionId.toString(),
         "query.user.id": userId.toString(),
         "query.authType": authType,
      });

      const now = new Date();
      const oldRefreshTokenHash = hashRefreshToken(oldRefreshToken);
      const session = await prisma.authSession.findFirst({
         where: {
            id: BigInt(sessionId),
            userId: BigInt(userId),
            authType,
            refreshTokenHash: oldRefreshTokenHash,
            revokedAt: null,
            expiresAt: { gt: now },
         },
         select: { authProvider: true },
      });
      if (!session) return null;

      const authProvider = session.authProvider as OAuthProvider | null;
      const payload = { id: userId, sessionId, authType, authProvider: authProvider ?? undefined, lastAuthenticatedAt };
      const [token, refreshToken] = await Promise.all([
         createToken("user-access", payload, CONSTANTS.ACCESS_TOKEN_EXPIRE_TIME),
         createToken("user-refresh", { ...payload, tokenId: randomUUID() }, CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME),
      ]);

      const result = await prisma.authSession.updateMany({
         where: {
            id: BigInt(sessionId),
            userId: BigInt(userId),
            authType,
            refreshTokenHash: oldRefreshTokenHash,
            revokedAt: null,
            expiresAt: { gt: now },
         },
         data: {
            refreshTokenHash: hashRefreshToken(refreshToken),
            lastSeenAt: now,
            expiresAt: new Date(now.getTime() + CONSTANTS.REFRESH_TOKEN_EXPIRE_TIME_MS),
         },
      });

      return result.count === 1 ? { token, refreshToken } : null;
   });
}
