import { router } from "#server";
import { useValidatedBody } from "@huginn/backend-shared";
import { verifyToken, REFRESH_TOKEN_SECRET_ENCODED, createTokens } from "#utils/token-factory";
import { unauthorized } from "@huginn/backend-shared";
import { type APIPostRefreshTokenResult, constants, HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ refreshToken: z.string() });

router.post(
	"/auth/refresh-token",
	defineEventHandler(async (event) => {
		const body = await useValidatedBody(event, schema);

		const { valid, payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);

		if (!valid || !payload) {
			throw unauthorized(event);
		}

		const [accessToken, refreshToken] = await createTokens(
			{ id: payload?.id },
			constants.ACCESS_TOKEN_EXPIRE_TIME,
			constants.REFRESH_TOKEN_EXPIRE_TIME,
		);

		const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
