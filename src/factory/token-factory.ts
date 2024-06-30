import { TokenPayload } from "@shared/api-types";
import * as jose from "jose";
import { tokenInvalidator } from "../server";

export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET ?? "");
export const ACCESS_TOKEN_SECRET = process.env.ACCESS_TOKEN_SECRET ?? "";
export const REFRESH_TOKEN_SECRET = process.env.REFRESH_TOKEN_SECRET ?? "";

export async function createTokens(
   payload: TokenPayload,
   accessExpireTime: string,
   refreshExpireTime: string
): Promise<[string, string]> {
   const accessToken = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(accessExpireTime)
      .setIssuedAt()
      .sign(ACCESS_TOKEN_SECRET_ENCODED);

   const refreshToken = await new jose.SignJWT({ id: payload.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(refreshExpireTime)
      .sign(REFRESH_TOKEN_SECRET_ENCODED);

   return [accessToken, refreshToken];
}

export async function verifyToken(
   token: string,
   secret: Uint8Array = ACCESS_TOKEN_SECRET_ENCODED
): Promise<{ valid: boolean; payload: (TokenPayload & jose.JWTPayload) | null }> {
   // if (tokenInvalidator.getInvalidTokens().includes(token)) {
   //    return [false, null];
   // }

   try {
      if (tokenInvalidator.isInvalid(token)) {
         return { valid: false, payload: null };
      }

      const jwt = await jose.jwtVerify<TokenPayload>(token, secret);

      if (!("id" in jwt.payload)) {
         return { valid: false, payload: null };
      }

      return { valid: true, payload: jwt.payload };
   } catch (e) {
      return { valid: false, payload: null };
   }
}
