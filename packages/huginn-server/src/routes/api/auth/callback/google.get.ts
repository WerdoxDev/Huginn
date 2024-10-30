import { forbidden, singleError, unauthorized, useValidatedQuery } from "@huginn/backend-shared";
import {
	constants,
	CDNRoutes,
	Errors,
	FieldCode,
	Fields,
	HttpCode,
	IdentityProviderType,
	RequestMethod,
	WorkerID,
	getFileHash,
	snowflake,
} from "@huginn/shared";
import { toSnakeCase } from "@std/text";
import { defineEventHandler, send, sendNoContent, sendRedirect, setResponseStatus, useSession } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { gateway, router } from "#server";
import { envs } from "#setup";
import { dispatchToTopic } from "#utils/gateway-utils";
import { cdnUpload, serverFetch } from "#utils/server-request";
import { createTokens } from "#utils/token-factory";

const querySchema = z.object({ code: z.optional(z.string()), error: z.optional(z.string()), state: z.optional(z.string()) });

type GoogleOAuth2Response =
	| { error: string }
	| { access_token: string; expires_in: number; refresh_token: string; scope: string; token_type: string; id_token: string };

type GoogleUserReponse = {
	id: string;
	email: string;
	verified_email: boolean;
	name: string;
	given_name: string;
	family_name: string;
	picture: string;
};

router.get(
	"/auth/callback/google",
	defineEventHandler(async (event) => {
		if (!envs.GOOGLE_CLIENT_ID || !envs.GOOGLE_CLIENT_SECRET || !envs.SESSION_PASSWORD) {
			return sendNoContent(event, HttpCode.NOT_IMPLEMENTED);
		}

		const { code, error, state } = await useValidatedQuery(event, querySchema);

		const { redirect_url, state: sessionState, flow, peer_id } = (await useSession(event, { password: envs.SESSION_PASSWORD })).data;
		if (sessionState !== state || !state) {
			return forbidden(event);
		}

		if (code) {
			const query = new URLSearchParams({
				client_id: envs.GOOGLE_CLIENT_ID,
				client_secret: envs.GOOGLE_CLIENT_SECRET,
				code: code,
				grant_type: "authorization_code",
				redirect_uri: "http://localhost:3001/api/auth/callback/google",
			});

			const response: GoogleOAuth2Response = await serverFetch("https://accounts.google.com/o/oauth2/token", RequestMethod.POST, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: query.toString(),
			});

			if ("error" in response) {
				return forbidden(event);
			}

			const user: GoogleUserReponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", RequestMethod.GET, {
				token: response.access_token,
			});

			if (await prisma.user.exists({ email: user.email })) {
				dispatchToTopic(state, "oauth_redirect", { error: FieldCode.EMAIL_IN_USE });

				const redirectUrl = new URL(flow === "browser" ? redirect_url : "http://localhost:3001/static/redirect.html");
				redirectUrl.searchParams.set("flow", flow);
				redirectUrl.searchParams.set("error", FieldCode.EMAIL_IN_USE);

				return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
			}

			const identityProvider = await prisma.identityProvider.upsert({
				where: { providerUserId: user.id },
				create: {
					id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
					providerType: IdentityProviderType.GOOGLE,
					providerUserId: user.id,
					refreshToken: response.refresh_token,
					completed: false,
				},
				update: { refreshToken: response.refresh_token },
			});

			let avatarHash: null | string = null;
			if (user.picture) {
				const avatarData = await (await fetch(user.picture.replace("s96-c", "s256-c"))).arrayBuffer();
				avatarHash = getFileHash(avatarData);
				avatarHash = (await cdnUpload<string>(CDNRoutes.uploadAvatar(user.id), { files: [{ data: avatarData, name: avatarHash }] })).split(
					".",
				)[0];
			}

			const [token] = await createTokens(
				{
					providerId: identityProvider.id.toString(),
					providerUserId: identityProvider.providerUserId,
					email: user.email,
					username: toSnakeCase(user.name),
					fullName: user.name,
					avatarHash: avatarHash,
				},
				constants.IDENTITY_TOKEN_EXPIRE_TIME,
				"",
			);

			dispatchToTopic(state, "oauth_redirect", { token: token });
			gateway.getSessionByKey(peer_id)?.unsubscribe(state);

			const redirectUrl = new URL(flow === "browser" ? redirect_url : "http://localhost:3001/static/redirect.html");
			redirectUrl.searchParams.set("flow", flow);
			redirectUrl.searchParams.set("token", token);

			return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
		}
		if (error === "access_denied") {
			return singleError(event, Errors.cancelled(), HttpCode.BAD_REQUEST);
		}
		if (error || !state) {
			return forbidden(event);
		}
	}),
);
