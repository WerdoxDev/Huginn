import { createRoute, tryCatch, validator } from "@huginn/backend-shared";
import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { assertError } from "@huginn/backend-shared/database";
import { prisma } from "@huginn/backend-shared/database";
import { DBErrorType } from "@huginn/backend-shared/types";
import { constants, type APIPostLoginResult, Errors, Fields, HttpCode, idFix } from "@huginn/shared";
import { z } from "zod";
import { createTokens } from "#utils/token-factory";

const schema = z.object({
	username: z.optional(z.string()),
	email: z.optional(z.string()),
	password: z.string(),
});

createRoute("POST", "/api/auth/login", validator("json", schema), async (c) => {
	const body = c.req.valid("json");

	const [error, user] = await tryCatch(async () => idFix(await prisma.user.findByCredentials(body)));

	if (assertError(error, DBErrorType.NULL_USER)) {
		return createHuginnError(
			c,
			createErrorFactory(Errors.invalidFormBody()).addError("login", Fields.invalidLogin()).addError("password", Fields.invalidLogin()),
		);
	}
	if (error) throw error;

	const [accessToken, refreshToken] = await createTokens(
		{ id: user.id, isOAuth: false },
		constants.ACCESS_TOKEN_EXPIRE_TIME,
		constants.REFRESH_TOKEN_EXPIRE_TIME,
	);

	const json: APIPostLoginResult = { ...user, token: accessToken, refreshToken: refreshToken };
	return c.json(json, HttpCode.OK);
});
