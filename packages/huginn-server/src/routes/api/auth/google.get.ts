import { catchError, forbidden, useValidatedQuery } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { decodeBase64 } from "@std/encoding";
import { defineEventHandler, sendNoContent, sendRedirect, useSession } from "h3";
import { z } from "zod";
import { gateway, router } from "#server";
import { envs } from "#setup";

const querySchema = z.object({
	redirect_url: z.optional(z.string()),
	state: z.string(),
	flow: z.string(),
	action: z.string(),
	peer_id: z.optional(z.string()),
});

router.get(
	"/auth/google",
	defineEventHandler(async (event) => {
		if (!envs.GOOGLE_CLIENT_ID || !envs.SESSION_PASSWORD) {
			return sendNoContent(event, HttpCode.NOT_IMPLEMENTED);
		}

		const { redirect_url, state, flow, peer_id, action } = await useValidatedQuery(event, querySchema);

		const [error, decodedToken] = await catchError(() => new TextDecoder().decode(decodeBase64(state)).split(":"));
		if (error) {
			return forbidden(event);
		}

		const [timestamp, randomValue] = decodedToken;
		if (!timestamp || !randomValue || randomValue.length !== 16) {
			return forbidden(event);
		}

		// If timestamp is not within a 5 minute window
		if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
			return forbidden(event);
		}

		const allowedOrigins = envs.ALLOWED_ORIGINS?.split(",");
		if (redirect_url && !allowedOrigins?.some((x) => redirect_url.includes(x))) {
			return forbidden(event);
		}

		const session = await useSession(event, { password: envs.SESSION_PASSWORD });
		await session.update({ state, redirect_url, flow, peer_id, action });

		if (flow === "websocket" && peer_id) {
			gateway.getSessionByKey(peer_id)?.subscribe(state);
		}

		const authEndpoint = new URL("https://accounts.google.com/o/oauth2/v2/auth");
		authEndpoint.searchParams.set("client_id", envs.GOOGLE_CLIENT_ID);
		authEndpoint.searchParams.set("redirect_uri", "http://localhost:3001/api/auth/callback/google");
		authEndpoint.searchParams.set("access_type", "offline");
		authEndpoint.searchParams.set("response_type", "code");
		authEndpoint.searchParams.set("state", state);
		authEndpoint.searchParams.set(
			"scope",
			"https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid",
		);
		authEndpoint.searchParams.set("access_type", "offline");

		return sendRedirect(event, authEndpoint.toString(), HttpCode.FOUND);
	}),
);
