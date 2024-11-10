import { forbidden, useValidatedQuery } from "@huginn/backend-shared";
import { constants, CDNRoutes, HttpCode, OAuthCode, RequestMethod, WorkerID, getFileHash, idFix, snowflake } from "@huginn/shared";
import { toSnakeCase } from "@std/text";
import { defineEventHandler, getHeader, getRequestProtocol, sendNoContent, sendRedirect, useSession } from "h3";
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
	| { access_token: string; expires_in: number; refresh_token?: string; scope: string; token_type: string; id_token: string };

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

		const { redirect_url, state: sessionState, flow, peer_id, action } = (await useSession(event, { password: envs.SESSION_PASSWORD })).data;
		if (sessionState !== state || !state) {
			return forbidden(event);
		}

		const host = `${getRequestProtocol(event)}://${getHeader(event, "host")}`;

		if (code) {
			const query = new URLSearchParams({
				client_id: envs.GOOGLE_CLIENT_ID,
				client_secret: envs.GOOGLE_CLIENT_SECRET,
				code: code,
				grant_type: "authorization_code",
				redirect_uri: `${host}/api/auth/callback/google`,
			});

			const response: GoogleOAuth2Response = await serverFetch("https://accounts.google.com/o/oauth2/token", RequestMethod.POST, {
				headers: { "Content-Type": "application/x-www-form-urlencoded" },
				body: query.toString(),
			});

			if ("error" in response) {
				return forbidden(event);
			}

			const googleUser: GoogleUserReponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", RequestMethod.GET, {
				token: response.access_token,
			});

			const identityProvider = idFix(await prisma.identityProvider.findUnique({ where: { providerUserId: googleUser.id } }));

			// Identity provider exists and is completed
			if (identityProvider?.completed && identityProvider?.userId) {
				const [accessToken, refreshToken] = await createTokens(
					{ id: identityProvider.userId, isOAuth: true },
					constants.ACCESS_TOKEN_EXPIRE_TIME,
					constants.REFRESH_TOKEN_EXPIRE_TIME,
				);

				dispatchToTopic(state, "oauth_redirect", { access_token: accessToken, refresh_token: refreshToken });

				const redirectUrl = new URL(flow === "browser" ? redirect_url : `${host}/static/redirect.html`);
				redirectUrl.searchParams.set("flow", flow);
				redirectUrl.searchParams.set("access_token", accessToken);
				redirectUrl.searchParams.set("refresh_token", refreshToken);

				return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
			}

			// Does not exist or is not completed
			const upsertedIdentityProvider = await prisma.identityProvider.upsert({
				where: { providerUserId: googleUser.id },
				create: {
					id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
					providerType: "google",
					providerUserId: googleUser.id,
					refreshToken: response.refresh_token,
					completed: false,
				},
				update: {},
			});

			let avatarHash: null | string = null;
			if (googleUser.picture) {
				const avatarData = await (await fetch(googleUser.picture.replace("s96-c", "s256-c"))).arrayBuffer();
				avatarHash = getFileHash(avatarData);
				console.log(avatarHash);
				avatarHash = (await cdnUpload<string>(CDNRoutes.uploadAvatar(googleUser.id), { files: [{ data: avatarData, name: avatarHash }] })).split(
					".",
				)[0];
			}

			const [token] = await createTokens(
				{
					providerId: upsertedIdentityProvider.id.toString(),
					providerUserId: upsertedIdentityProvider.providerUserId,
					email: googleUser.email,
					username: toSnakeCase(googleUser.name),
					fullName: googleUser.name,
					avatarHash: avatarHash,
				},
				constants.IDENTITY_TOKEN_EXPIRE_TIME,
				"",
			);

			dispatchToTopic(state, "oauth_redirect", { token: token });
			gateway.getSessionByKey(peer_id)?.unsubscribe(state);

			const redirectUrl = new URL(flow === "browser" ? redirect_url : `${host}/static/redirect.html`);
			redirectUrl.searchParams.set("flow", flow);
			redirectUrl.searchParams.set("token", token);

			return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
		}

		// User clicked "Cancel"
		if (error === "access_denied") {
			const redirectUrl = new URL(flow === "browser" ? new URL(redirect_url).origin : `${host}/static/redirect.html`);
			redirectUrl.searchParams.set("flow", flow);
			redirectUrl.searchParams.set("error", OAuthCode.CANCELLED);

			return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
		}
		if (error || !state) {
			return forbidden(event);
		}
	}),
);
