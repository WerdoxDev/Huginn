import { createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { constants, type APIPatchCurrentUserResult, CDNRoutes, Errors, Fields, HttpCode, getFileHash, idFix, toArrayBuffer } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { selectPrivateUser } from "#database/common";
import { gateway, router } from "#server";
import { dispatchToTopic } from "#utils/gateway-utils";
import { useVerifiedJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import { createTokens } from "#utils/token-factory";
import {
	validateCorrectPassword,
	validateDisplayName,
	validateEmail,
	validateEmailUnique,
	validatePassword,
	validateUsername,
	validateUsernameUnique,
} from "#utils/validation";

const schema = z.object({
	email: z.optional(z.string()),
	username: z.optional(z.string()),
	displayName: z.optional(z.nullable(z.string())),
	avatar: z.optional(z.nullable(z.string())),
	password: z.optional(z.string()),
	newPassword: z.optional(z.string()),
});

router.patch(
	"/users/@me",
	defineEventHandler(async (event) => {
		const { payload } = await useVerifiedJwt(event);
		const body = await useValidatedBody(event, schema);

		const formError = createErrorFactory(Errors.invalidFormBody());

		validateUsername(body.username, formError);
		validateDisplayName(body.displayName, formError);
		validateEmail(body.email, formError);
		validatePassword(body.newPassword, formError, "newPassword");

		if (body.newPassword && !body.password) {
			formError.addError("password", Fields.required());
		}

		if (formError.hasErrors()) {
			return createHuginnError(event, formError);
		}

		const databaseError = createErrorFactory(Errors.invalidFormBody());

		const user = idFix(await prisma.user.getById(payload.id));
		validateCorrectPassword(body.password, user.password, databaseError);

		await validateUsernameUnique(body.username, databaseError);
		await validateEmailUnique(body.email, databaseError);

		if (databaseError.hasErrors()) {
			return createHuginnError(event, databaseError);
		}

		// Undefined means no change, null means delete, other values are set
		let avatarHash: string | undefined | null = undefined;
		if (body.avatar !== null && body.avatar !== undefined) {
			const data = toArrayBuffer(body.avatar);
			avatarHash = getFileHash(data);

			avatarHash = (
				await cdnUpload<string>(CDNRoutes.uploadAvatar(user.id), {
					files: [{ data: data, name: avatarHash }],
				})
			).split(".")[0];
		} else if (body.avatar === null) {
			avatarHash = null;
		}

		const updatedUser = idFix(
			await prisma.user.edit(
				payload.id,
				{
					email: body.email,
					username: body.username?.toLowerCase(),
					displayName: !body.displayName && body.displayName !== undefined ? null : body.displayName,
					avatar: avatarHash,
					password: body.newPassword,
				},
				undefined,
				selectPrivateUser,
			),
		);

		const [accessToken, refreshToken] = await createTokens(
			{ id: payload.id, isOAuth: payload.isOAuth },
			constants.ACCESS_TOKEN_EXPIRE_TIME,
			constants.REFRESH_TOKEN_EXPIRE_TIME,
		);

		// TODO: When guilds are a thing, this should send an update to users that are viewing that guild
		dispatchToTopic(payload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });

		gateway.presenceManeger.updateClientUser(updatedUser);
		const presence = gateway.presenceManeger.getClient(payload.id);
		if (presence) {
			dispatchToTopic(`${payload.id}_presence`, "presence_update", presence);
		}

		const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };
		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
