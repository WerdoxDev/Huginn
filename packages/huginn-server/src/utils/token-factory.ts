import type { IdentityTokenPayload, Snowflake, TokenPayload } from "@huginn/shared";
import * as jose from "jose";
import { tokenInvalidator } from "#server";
import { envs } from "#setup";

export const ACCESS_TOKEN_SECRET_ENCODED = new TextEncoder().encode(envs.ACCESS_TOKEN_SECRET ?? "");
export const REFRESH_TOKEN_SECRET_ENCODED = new TextEncoder().encode(envs.REFRESH_TOKEN_SECRET ?? "");

type TokenResult<Payload extends TokenPayload | IdentityTokenPayload> = Payload extends { id: Snowflake } ? [string, string] : [string];

export async function createTokens<Payload extends TokenPayload | IdentityTokenPayload>(
	payload: Payload,
	accessExpireTime: string,
	refreshExpireTime: string,
): Promise<TokenResult<Payload>> {
	const accessToken = await new jose.SignJWT({ ...payload })
		.setProtectedHeader({ alg: "HS256" })
		.setExpirationTime(accessExpireTime)
		.setIssuedAt()
		.sign(ACCESS_TOKEN_SECRET_ENCODED);

	let refreshToken: string | undefined;
	if ("id" in payload) {
		refreshToken = await new jose.SignJWT({ id: payload.id })
			.setProtectedHeader({ alg: "HS256" })
			.setExpirationTime(refreshExpireTime)
			.sign(REFRESH_TOKEN_SECRET_ENCODED);
	}

	return [accessToken, refreshToken] as TokenResult<Payload>;
}

export async function verifyToken(
	token: string,
	secret: Uint8Array = ACCESS_TOKEN_SECRET_ENCODED,
): Promise<{ valid: boolean; payload: ((TokenPayload | IdentityTokenPayload) & jose.JWTPayload) | null }> {
	try {
		if (tokenInvalidator.isInvalid(token)) {
			return { valid: false, payload: null };
		}

		const jwt = await jose.jwtVerify<TokenPayload>(token, secret);

		if (!("id" in jwt.payload) && !("providerId" in jwt.payload)) {
			return { valid: false, payload: null };
		}

		return { valid: true, payload: jwt.payload };
	} catch (e) {
		return { valid: false, payload: null };
	}
}
