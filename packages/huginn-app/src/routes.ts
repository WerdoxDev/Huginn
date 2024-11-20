import type { RouteConfig } from "@react-router/dev/routes";
import { index, layout, route } from "@react-router/dev/routes";

export const routes: RouteConfig = [
	index("routes/home.tsx"),
	route("splashscreen", "routes/splashscreen.tsx"),
	layout("routes/app/app-layout.tsx", [
		layout("routes/app/auth/auth-layout.tsx", [
			route("login", "routes/app/auth/login.tsx"),
			route("register", "routes/app/auth/register.tsx"),
			route("oauth-redirect", "routes/app/auth/oauth-redirect.tsx"),
		]),
		layout("routes/app/main/main-layout.tsx", [
			layout("routes/app/main/home/home-layout.tsx", [
				route("friends", "routes/app/main/home/friends.tsx"),
				route("channels/@me", "routes/app/main/home/channels.@me.tsx"),
				route("channels/@me/:channelId", "routes/app/main/home/channels.@me.$channelId.tsx"),
			]),
		]),
	]),
];
