import type { Snowflake } from "@huginn/shared";
import * as jose from "jose";

const VOICE_TOKEN_SECRET_ENCODED = new TextEncoder().encode(process.env.VOICE_TOKEN_SECRET ?? "");

export async function createVoiceToken(userId: Snowflake) {
	const token = await new jose.SignJWT({ userId })
		.setProtectedHeader({ alg: "HS256" })
		.setIssuedAt()
		.setExpirationTime("10m")
		.sign(VOICE_TOKEN_SECRET_ENCODED);

	return token;
}

export async function verifyVoiceToken(token: string) {
	try {
		const jwt = await jose.jwtVerify<{ userId: Snowflake }>(token, VOICE_TOKEN_SECRET_ENCODED);
		return { valid: true, payload: jwt.payload };
	} catch (e) {
		return { valid: false };
	}
}
