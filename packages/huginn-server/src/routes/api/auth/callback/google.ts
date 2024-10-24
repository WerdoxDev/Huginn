import { unauthorized, useValidatedQuery } from "@huginn/backend-shared";
import { HttpCode, IdentityProviderType, RequestMethod, WorkerID, snowflake } from "@huginn/shared";
import { toSnakeCase } from "@std/text";
import { defineEventHandler, sendNoContent, sendRedirect, useSession } from "h3";
import { z } from "zod";
import { prisma } from "#database";
import { router } from "#server";
import { envs } from "#setup";
import { serverFetch } from "#utils/server-request";

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

		const session = await useSession(event, { password: envs.SESSION_PASSWORD });
		if (session.data.state !== state || !state) {
			return unauthorized(event);
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
				return unauthorized(event);
			}

			const user: GoogleUserReponse = await serverFetch("https://www.googleapis.com/userinfo/v2/me", RequestMethod.GET, {
				token: response.access_token,
			});

			prisma.identityProvider.create({
				data: {
					id: snowflake.generate(WorkerID.IDENTITY_PROVIDER),
					providerType: IdentityProviderType.GOOGLE,
					providerUserId: user.id,
					completed: false,
				},
			});

			const redirectUrl = new URL(session.data.redirect_url);
			redirectUrl.searchParams.set("email", user.email);
			redirectUrl.searchParams.set("username", toSnakeCase(user.name));

			return sendRedirect(event, redirectUrl.toString(), HttpCode.FOUND);
		}
		if (error || !state) {
			return unauthorized(event);
		}
	}),
);
