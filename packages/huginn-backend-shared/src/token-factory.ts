import type { OAuthTokenPayload, Snowflake, UserTokenPayload } from "@huginn/shared";
import * as jose from "jose";

export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "");
export const OAUTH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.OAUTH_TOKEN_SECRET ?? "");
export const CDN_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.CDN_TOKEN_SECRET ?? "");

type TokenType = "user-access" | "user-refresh" | "oauth" | "cdn"
type TokenPayload<Type extends TokenType> = Type extends "user-access" ? UserTokenPayload : Type extends "user-refresh" ? { id: Snowflake } : Type extends "oauth" ? OAuthTokenPayload : { test: string }

const tokenSecrets: Record<TokenType, Uint8Array<ArrayBuffer>> = { "user-access": ACCESS_TOKEN_SECRET_ENCODED, "user-refresh": REFRESH_TOKEN_SECRET_ENCODED, cdn: CDN_TOKEN_SECRET_ENCODED, oauth: OAUTH_TOKEN_SECRET_ENCODED }
const invalidatedTokens: string[] = []

export async function createToken<Type extends TokenType>(
   type: Type,
   payload: TokenPayload<Type>,
   expireTime: string,
): Promise<string> {
   const token = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(expireTime)
      .setIssuedAt()
      .sign(tokenSecrets[type]);

   // let refreshToken: string | undefined;
   // if ("id" in payload) {
   //    refreshToken = await new jose.SignJWT({ id: payload.id })
   //       .setProtectedHeader({ alg: "HS256" })
   //       .setExpirationTime(refreshExpireTime)
   //       .sign(REFRESH_TOKEN_SECRET_ENCODED);
   // }
   return token;

   // return [accessToken, refreshToken] as TokenPayload<Payload>;
}

export async function verifyToken<IdentityToken extends boolean = false>(token: string, secret: Uint8Array = ACCESS_TOKEN_SECRET_ENCODED) {
   try {
      if (isTokenInvalid(token)) {
         return { valid: false, payload: null };
      }

      const jwt = await jose.jwtVerify<IdentityToken extends false ? UserTokenPayload : OAuthTokenPayload>(token, secret);

      if (!("id" in jwt.payload) && !("providerId" in jwt.payload)) {
         return { valid: false, payload: null };
      }

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