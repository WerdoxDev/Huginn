import { createErrorFactory, createHuginnError, createRoute, unauthorized, validator } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import {
	constants,
	type APIPostOAuthConfirmResult,
	CDNRoutes,
	Errors,
	HttpCode,
	UserFlags,
	WorkerID,
	getFileHash,
	idFix,
	snowflake,
	toArrayBuffer,
} from "@huginn/shared";
import { z } from "zod";
import { verifyJwt } from "#utils/route-utils";
import { cdnUpload } from "#utils/server-request";
import { createTokens } from "#utils/token-factory";
import { validateDisplayName, validateUsername, validateUsernameUnique } from "#utils/validation";

const schema = z.object({ username: z.string(), displayName: z.nullable(z.string()), avatar: z.nullable(z.string()) });

createRoute("POST", "/api/auth/oauth-confirm", verifyJwt(true), validator("json", schema), async (c) => {
	const payload = c.get("identityTokenPayload");
	const body = c.req.valid("json");

	const identityProvider = await prisma.identityProvider.findUnique({ where: { id: BigInt(payload.providerId) } });

	if (!identityProvider) {
		return unauthorized(c);
	}

	const formError = createErrorFactory(Errors.invalidFormBody());

	validateUsername(body.username, formError);
	validateDisplayName(body.displayName, formError);

	if (formError.hasErrors()) {
		return createHuginnError(c, formError);
	}

	const databaseError = createErrorFactory(Errors.invalidFormBody());

	if (!(await validateUsernameUnique(body.username, databaseError))) {
		return createHuginnError(c, databaseError);
	}

	const newUserId = snowflake.generateString(WorkerID.AUTH);

	// null means no avatar, other values are set
	let avatarHash: string | null = null;
	if (body.avatar !== null) {
		const data = toArrayBuffer(body.avatar);
		avatarHash = getFileHash(data);

		avatarHash = (
			await cdnUpload<string>(CDNRoutes.uploadAvatar(newUserId), {
				files: [{ data: data, name: avatarHash }],
			})
		).split(".")[0];
	} else if (body.avatar === null) {
		avatarHash = null;
	}

	const user = idFix(
		await prisma.user.create({
			data: {
				id: BigInt(newUserId),
				email: payload.email,
				username: body.username,
				displayName: body.displayName,
				avatar: avatarHash,
				flags: UserFlags.NONE,
				password: null,
				system: false,
			},
			select: selectPrivateUser,
		}),
	);

	await prisma.identityProvider.update({ where: { providerUserId: payload.providerUserId }, data: { userId: BigInt(user.id), completed: true } });

	const [accessToken, refreshToken] = await createTokens(
		{ id: user.id, isOAuth: true },
		constants.ACCESS_TOKEN_EXPIRE_TIME,
		constants.REFRESH_TOKEN_EXPIRE_TIME,
	);

	const json: APIPostOAuthConfirmResult = { ...user, token: accessToken, refreshToken: refreshToken };
	return c.json(json, HttpCode.CREATED);
});
