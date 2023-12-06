import { TokenPayload } from "@shared/types";
import * as jose from "jose";

export const ACCESS_TOKEN_SECRET = new TextEncoder().encode(process.env.ACCESS_TOKEN_SECRET || "");
export const REFRESH_TOKEN_SECRET = new TextEncoder().encode(process.env.REFRESH_TOKEN_SECRET || "");

export async function createTokens(
   payload: TokenPayload,
   accessExpireTime: string,
   refreshExpireTime: string
): Promise<[string, string]> {
   const accessToken = await new jose.SignJWT({ ...payload })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(accessExpireTime)
      .setIssuedAt()
      .sign(ACCESS_TOKEN_SECRET);

   const refreshToken = await new jose.SignJWT({ id: payload.id })
      .setProtectedHeader({ alg: "HS256" })
      .setExpirationTime(refreshExpireTime)
      .sign(REFRESH_TOKEN_SECRET);

   return [accessToken, refreshToken];
}

export async function verifyToken(
   token: string,
   secret: Uint8Array = ACCESS_TOKEN_SECRET
): Promise<[boolean, (TokenPayload & jose.JWTPayload) | null]> {
   // if (tokenInvalidator.getInvalidTokens().includes(token)) {
   //    return [false, null];
   // }

   try {
      const jwt = await jose.jwtVerify<TokenPayload>(token, secret);

      return [true, jwt.payload];
   } catch (e) {
      return [false, null];
   }
}
