import type { OAuthTokenPayload, Snowflake, UserTokenPayload } from "@huginn/shared";
import * as jose from "jose";

console.log(process.env.ACCESS_TOKEN_SECRET);
export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "");
export const OAUTH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.OAUTH_TOKEN_SECRET ?? "");
export const CDN_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.CDN_TOKEN_SECRET ?? "");
export const VOICE_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.VOICE_TOKEN_SECRET ?? "");

export type TokenType = "user-access" | "user-refresh" | "oauth" | "cdn" | "voice";
type TokenPayload<Type extends TokenType> = Type extends "user-access"
   ? UserTokenPayload
   : Type extends "user-refresh"
     ? { id: Snowflake }
     : Type extends "oauth"
       ? OAuthTokenPayload
       : Type extends "voice"
         ? { userId: Snowflake }
         : any;

const tokenSecrets: Record<TokenType, Uint8Array<ArrayBuffer>> = {
   "user-access": ACCESS_TOKEN_SECRET_ENCODED,
   "user-refresh": REFRESH_TOKEN_SECRET_ENCODED,
   cdn: CDN_TOKEN_SECRET_ENCODED,
   oauth: OAUTH_TOKEN_SECRET_ENCODED,
   voice: VOICE_TOKEN_SECRET_ENCODED,
};
const invalidatedTokens: string[] = [];

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
      if (isTokenInvalid(token)) {
         return { valid: false, payload: null };
      }

      const secret = tokenSecrets[type];
      const jwt = await jose.jwtVerify<TokenPayload<Type>>(token, secret);

      // if (!("id" in jwt.payload) && !("providerId" in jwt.payload)) {
      //    return { valid: false, payload: null };
      // }

      return { valid: true, payload: jwt.payload };
      // oxlint-disable-next-line no-unused-vars
   } catch (e) {
      return { valid: false, payload: null };
   }
}

export function invalidateToken(token: string) {
   if (!invalidatedTokens.includes(token)) {
      invalidatedTokens.push(token);
   }
}

export function isTokenInvalid(token: string) {
   return invalidatedTokens.includes(token);
}
