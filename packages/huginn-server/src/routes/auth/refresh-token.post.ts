import { createRoute, validator } from "@huginn/backend-shared";
import { unauthorized } from "@huginn/backend-shared";
import { constants, type APIPostRefreshTokenResult, HttpCode, idFix } from "@huginn/shared";
import { z } from "zod";
import { prisma } from "#database";
import { REFRESH_TOKEN_SECRET_ENCODED, createTokens, verifyToken } from "#utils/token-factory";

const schema = z.object({ refreshToken: z.string() });

createRoute("POST", "/api/auth/refresh-token", validator("json", schema), async (c) => {
	const body = c.req.valid("json");

	const { valid, payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);

	if (!valid || !payload) {
		throw unauthorized(c);
	}

	const user = idFix(await prisma.user.getById(payload.id, { select: { id: true } }));

	const [accessToken, refreshToken] = await createTokens(
		{ id: user.id, isOAuth: await prisma.identityProvider.exists({ userId: BigInt(user.id) }) },
		constants.ACCESS_TOKEN_EXPIRE_TIME,
		constants.REFRESH_TOKEN_EXPIRE_TIME,
	);

	const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
	return c.json(json, HttpCode.OK);
});
