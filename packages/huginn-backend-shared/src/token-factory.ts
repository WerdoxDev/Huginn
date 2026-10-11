import type { OAuthTokenPayload, Snowflake, UserRefreshTokenPayload, UserTokenPayload } from "@huginnjs/shared";

import * as jose from "jose";

import { prisma } from "#database";

export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "");
export const OAUTH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.OAUTH_TOKEN_SECRET ?? "");
export const CDN_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.CDN_TOKEN_SECRET ?? "");
export const VOICE_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.VOICE_TOKEN_SECRET ?? "");

export type TokenType = "user-access" | "user-refresh" | "oauth" | "cdn" | "voice";
export type TokenPayload<Type extends TokenType> = Type extends "user-access"
   ? UserTokenPayload
   : Type extends "user-refresh"
     ? UserRefreshTokenPayload
     : Type extends "oauth"
       ? OAuthTokenPayload
       : Type extends "voice"
         ? { userId: Snowflake }
         : any;

const tokenSecrets: Record<TokenType, Uint8Array<ArrayBufferLike>> = {
   "user-access": ACCESS_TOKEN_SECRET_ENCODED,
   "user-refresh": REFRESH_TOKEN_SECRET_ENCODED,
   cdn: CDN_TOKEN_SECRET_ENCODED,
   oauth: OAUTH_TOKEN_SECRET_ENCODED,
   voice: VOICE_TOKEN_SECRET_ENCODED,
};

export function createToken<Type extends TokenType>(type: Type, payload: TokenPayload<Type>, expirationTime?: string): Promise<string> {
   let token = new jose.SignJWT({ ...payload }).setProtectedHeader({ alg: "HS256" }).setIssuedAt();

   if (expirationTime) {
      token = token.setExpirationTime(expirationTime);
   }

   const signedToken = token.sign(tokenSecrets[type]);

   return signedToken;
}

export async function verifyToken<Type extends TokenType>(type: Type, token: string) {
   try {
      const secret = tokenSecrets[type];
      const jwt = await jose.jwtVerify<TokenPayload<Type>>(token, secret);

      if (type === "user-access") {
         const payload = jwt.payload as UserTokenPayload;
         if (!payload.sessionId || !payload.id) return { valid: false, payload: null };
         const session = await prisma.authSession.findFirst({
            where: { id: BigInt(payload.sessionId), userId: BigInt(payload.id), revokedAt: null, expiresAt: { gt: new Date() } },
            select: { id: true, lastSeenAt: true },
         });
         if (!session) return { valid: false, payload: null };
         if (Date.now() - session.lastSeenAt.getTime() > 60 * 60 * 1000) {
            await prisma.authSession.updateMany({
               where: { id: session.id, lastSeenAt: { lt: new Date(Date.now() - 60 * 60 * 1000) } },
               data: { lastSeenAt: new Date() },
            });
         }
      }

      // if (!("id" in jwt.payload) && !("providerId" in jwt.payload)) {
      //    return { valid: false, payload: null };
      // }

      return { valid: true, payload: jwt.payload };
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      return { valid: false, payload: null };
   }
}
