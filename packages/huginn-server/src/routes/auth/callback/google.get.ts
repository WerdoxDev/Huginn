import { createRoute, forbidden, validator } from "@huginn/backend-shared";
import { constants, CDNRoutes, HttpCode, OAuthCode, WorkerID, getFileHash, idFix, snowflake } from "@huginn/shared";
import { toSnakeCase } from "@std/text";

import { prisma } from "@huginn/backend-shared/database";
import consola from "consola";
import { z } from "zod";
import { gateway } from "#setup";
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

createRoute("GET", "/api/auth/callback/google", validator("query", querySchema), async (c) => {
	if (!envs.GOOGLE_CLIENT_ID || !envs.GOOGLE_CLIENT_SECRET || !envs.SESSION_PASSWORD) {
		return c.newResponse(null, HttpCode.NOT_IMPLEMENTED);
	}

	const { code, error, state } = c.req.valid("query");
	const session = c.get("session");

	const redirect_url = session.get("redirect_url");
	const sessionState = session.get("state");
	const flow = session.get("flow");
	const peer_id = session.get("peer_id");

	if (sessionState !== state || !state) {
		consola.info("Session state mismatch");
		return forbidden(c);
	}

	const host = envs.REDIRECT_HOST;

	// Code from google oauth
	if (code) {
		const query = new URLSearchParams({
			client_id: envs.GOOGLE_CLIENT_ID,
			client_secret: envs.GOOGLE_CLIENT_SECRET,
			code: code,
			grant_type: "authorization_code",
			redirect_uri: `${host}/api/auth/callback/google`,
		});

		// Get a token using the code
		const response: GoogleOAuth2Response = await serverFetch("https://accounts.google.com/o/oauth2/token", "POST", {
			headers: { "Content-Type": "application/x-www-form-urlencoded" },
			body: query.toString(),
		});

		// Return 'Forbidden' if can't get the token
		if ("error" in response) {
			consola.info("Error in response", response);
			return forbidden(c);
		}

		// Use the token to fetch the google user
		const googleUser: GoogleUserReponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", "GET", {
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

			// Dispatch to whoever is subbed to the state topic of this authentication
			dispatchToTopic(state, "oauth_redirect", { access_token: accessToken, refresh_token: refreshToken });
			gateway.getSessionByKey(peer_id)?.unsubscribe(state);

			const searchParam = new URLSearchParams({ flow, access_token: accessToken, refresh_token: refreshToken });
			const redirectUrl = `${flow === "browser" ? redirect_url : `${host}/redirect.html`}?${searchParam.toString()}`;

			return c.redirect(redirectUrl.toString(), HttpCode.FOUND);
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

		// Get the user's avatar
		let avatarHash: null | string = null;
		if (googleUser.picture) {
			const avatarData = await (await fetch(googleUser.picture.replace("s96-c", "s256-c"))).arrayBuffer();
			avatarHash = getFileHash(avatarData);
			console.log(avatarHash);
			avatarHash = (await cdnUpload<string>(CDNRoutes.uploadAvatar(googleUser.id), { files: [{ data: avatarData, name: avatarHash }] })).split(
				".",
			)[0];
		}

		// Create an identity token
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

		const searchParam = new URLSearchParams({ flow, token });
		const redirectUrl = `${flow === "browser" ? redirect_url : `${host}/redirect.html`}?${searchParam.toString()}`;

		return c.redirect(redirectUrl.toString(), HttpCode.FOUND);
	}

	// User clicked "Cancel"
	if (error === "access_denied") {
		const redirectUrl = new URL(flow === "browser" ? new URL(redirect_url).origin : `${host}/redirect.html`);
		redirectUrl.searchParams.set("flow", flow);
		redirectUrl.searchParams.set("error", OAuthCode.CANCELLED);

		return c.redirect(redirectUrl.toString(), HttpCode.FOUND);
	}
	if (error || !state) {
		consola.info("Error or no state");
		return forbidden(c);
	}
});
