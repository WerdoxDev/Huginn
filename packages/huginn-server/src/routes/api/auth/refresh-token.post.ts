import { useValidatedBody } from "@huginn/backend-shared";
import { unauthorized } from "@huginn/backend-shared";
import { constants, type APIPostRefreshTokenResult, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { router } from "#server";
import { REFRESH_TOKEN_SECRET_ENCODED, createTokens, verifyToken } from "#utils/token-factory";

const schema = z.object({ refreshToken: z.string() });

router.post(
	"/auth/refresh-token",
	defineEventHandler(async (event) => {
		const body = await useValidatedBody(event, schema);

		const { valid, payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);

		if (!valid || !payload) {
			throw unauthorized(event);
		}

		const user = idFix(await prisma.user.getById(payload.id));

		const [accessToken, refreshToken] = await createTokens(
			{ id: user.id, isOAuth: await prisma.identityProvider.exists({ userId: BigInt(user.id) }) },
			constants.ACCESS_TOKEN_EXPIRE_TIME,
			constants.REFRESH_TOKEN_EXPIRE_TIME,
		);

		const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
