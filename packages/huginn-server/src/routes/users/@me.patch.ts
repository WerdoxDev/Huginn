import { createErrorFactory, createHuginnError, createRoute, validator } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { constants, type APIPatchCurrentUserResult, CDNRoutes, Errors, Fields, HttpCode, getFileHash, idFix, toArrayBuffer } from "@huginn/shared";
import { z } from "zod";
import { gateway } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { verifyJwt } from "#utils/route-utils";
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

createRoute("PATCH", "/api/users/@me", verifyJwt(), validator("json", schema), async (c) => {
	const payload = c.get("tokenPayload");
	const body = c.req.valid("json");

	const formError = createErrorFactory(Errors.invalidFormBody());

	validateUsername(body.username, formError);
	validateDisplayName(body.displayName, formError);
	validateEmail(body.email, formError);
	validatePassword(body.newPassword, formError, "newPassword");

	if (body.newPassword && !body.password) {
		formError.addError("password", Fields.required());
	}

	if (formError.hasErrors()) {
		return createHuginnError(c, formError);
	}

	const databaseError = createErrorFactory(Errors.invalidFormBody());

	const user = idFix(await prisma.user.getById(payload.id, { select: { id: true, password: true } }));
	validateCorrectPassword(body.password, user.password, databaseError);

	await validateUsernameUnique(body.username, databaseError);
	await validateEmailUnique(body.email, databaseError);

	if (databaseError.hasErrors()) {
		return createHuginnError(c, databaseError);
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
				password: body.newPassword ? body.newPassword : undefined,
			},
			{ select: selectPrivateUser },
		),
	);

	const [accessToken, refreshToken] = await createTokens(
		{ id: payload.id, isOAuth: payload.isOAuth },
		constants.ACCESS_TOKEN_EXPIRE_TIME,
		constants.REFRESH_TOKEN_EXPIRE_TIME,
	);

	// TODO: When guilds are a thing, this should send an update to users that are viewing that guild
	dispatchToTopic(payload.id, "user_update", { ...updatedUser, token: accessToken, refreshToken });

	gateway.presenceManeger.updateUserPresence(updatedUser);

	const json: APIPatchCurrentUserResult = { ...updatedUser, token: accessToken, refreshToken };
	return c.json(json, HttpCode.OK);
});
