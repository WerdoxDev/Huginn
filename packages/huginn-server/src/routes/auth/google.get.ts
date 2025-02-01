import { catchError, createRoute, forbidden, validator } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { decodeBase64 } from "@std/encoding";
import { z } from "zod";
import { envs, gateway } from "#setup";

const querySchema = z.object({
	redirect_url: z.optional(z.string()),
	state: z.string(),
	flow: z.string(),
	peer_id: z.optional(z.string()),
});

createRoute("GET", "/api/auth/google", validator("query", querySchema), async (c) => {
	if (!envs.GOOGLE_CLIENT_ID || !envs.SESSION_PASSWORD) {
		return c.newResponse(null, HttpCode.NOT_IMPLEMENTED);
	}

	const { redirect_url, state, flow, peer_id } = c.req.valid("query");

	const [error, decodedToken] = await catchError(() => new TextDecoder().decode(decodeBase64(state)).split(":"));
	if (error) {
		return forbidden(c);
	}

	const [timestamp, randomValue] = decodedToken;
	if (!timestamp || !randomValue || randomValue.length !== 16) {
		return forbidden(c);
	}

	// If timestamp is not within a 5 minute window
	if (Date.now() - Number(timestamp) > 5 * 60 * 1000) {
		return forbidden(c);
	}

	const allowedOrigins = envs.ALLOWED_ORIGINS?.split(",");
	if (redirect_url && !allowedOrigins?.some((x) => redirect_url.includes(x))) {
		return forbidden(c);
	}

	const session = c.get("session");
	session.set("state", state);
	session.set("redirect_url", redirect_url);
	session.set("flow", flow);
	session.set("peer_id", peer_id);

	if (flow === "websocket" && peer_id) {
		gateway.getSessionByKey(peer_id)?.subscribe(state);
	}

	const host = new URL(c.req.url).origin;
	// const host = `${getRequestProtocol(event)}://${getHeader(event, "host")}`;
	const authEndpoint = new URL("https://accounts.google.com/o/oauth2/v2/auth");
	authEndpoint.searchParams.set("client_id", envs.GOOGLE_CLIENT_ID);
	authEndpoint.searchParams.set("redirect_uri", `${host}/api/auth/callback/google`);
	authEndpoint.searchParams.set("access_type", "offline");
	authEndpoint.searchParams.set("response_type", "code");
	authEndpoint.searchParams.set("prompt", "consent");
	authEndpoint.searchParams.set("state", state);
	authEndpoint.searchParams.set("scope", "https://www.googleapis.com/auth/userinfo.email https://www.googleapis.com/auth/userinfo.profile openid");
	authEndpoint.searchParams.set("access_type", "offline");

	return c.redirect(authEndpoint.toString(), HttpCode.FOUND);
});
