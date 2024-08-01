import { TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { tokenInvalidator } from "../server";

const accessToken =
   "d118b15cdbd6fb8a234b087081158b94bb97f87266c0df6ddc185a7405346a4f972bff0f26882e572a3f16bc68d8b0e7a692fe9c1131bcd125e85b1ddd22ae03";
const refreshToken =
   "5d85b744ae5c04302e0243d35c25a539c358f513a19d715fe39afc02cce6fe6b78aa3708645c5ebe6c6218504bc42280f48ea556d45e92eaf1f1ecd7fd7d715f";

export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(accessToken ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(refreshToken ?? "");
export const ACCESS_TOKEN_SECRET = accessToken ?? "";
export const REFRESH_TOKEN_SECRET = refreshToken ?? "";

export async function createTokens(
   payload: TokenPayload,
   accessExpireTime: string,
   refreshExpireTime: string,
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
   secret: Uint8Array = ACCESS_TOKEN_SECRET_ENCODED,
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
