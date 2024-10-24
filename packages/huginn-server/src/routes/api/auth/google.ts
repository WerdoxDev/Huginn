import crypto from "node:crypto";
import { useValidatedQuery } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, sendNoContent, sendRedirect, useSession } from "h3";
import { z } from "zod";
import { router } from "#server";
import { envs } from "#setup";

const querySchema = z.object({ redirect_url: z.string() });

router.get(
	"/auth/google",
	defineEventHandler(async (event) => {
		if (!envs.GOOGLE_CLIENT_ID || !envs.SESSION_PASSWORD) {
			return sendNoContent(event, HttpCode.NOT_IMPLEMENTED);
		}

		const { redirect_url } = await useValidatedQuery(event, querySchema);

		const state = crypto.randomBytes(24).toString("hex");
		const session = await useSession(event, { password: envs.SESSION_PASSWORD });
		await session.update({ state, redirect_url });

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
