import { catchError, useValidatedBody } from "@huginn/backend-shared";
import { createErrorFactory, createHuginnError } from "@huginn/backend-shared";
import { DBErrorType } from "@huginn/backend-shared/types";
import { constants, type APIPostLoginResult, Errors, Fields, HttpCode, idFix } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { assertError } from "#database/error";
import { prisma } from "#database/index";
import { router } from "#server";
import { createTokens } from "#utils/token-factory";

const schema = z.object({
	username: z.optional(z.string()),
	email: z.optional(z.string()),
	password: z.string(),
});

router.post(
	"/auth/login",
	defineEventHandler(async (event) => {
		const body = await useValidatedBody(event, schema);

		const [error, user] = await catchError(async () => idFix(await prisma.user.findByCredentials(body)));

		if (assertError(error, DBErrorType.NULL_USER)) {
			return createHuginnError(
				event,
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
		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
