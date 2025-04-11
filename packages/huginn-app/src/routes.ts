import RouteErrorComponent from "@components/RouteErrorComponent";
import type { RouteConfig } from "@react-router/dev/routes";
import { index } from "@react-router/dev/routes";
import { createHashRouter } from "react-router";
import Root, { rootLoader } from "./root";
import AppLayout from "./routes/app/app-layout";
import AuthLayout, { authLoader } from "./routes/app/auth/auth-layout";
import Login from "./routes/app/auth/login";
import OauthRedirect from "./routes/app/auth/oauth-redirect";
import Register from "./routes/app/auth/register";
import ChannelMe from "./routes/app/main/home/channels.@me";
import ChannelWithId, { channelWithIdLoader } from "./routes/app/main/home/channels.@me.$channelId";
import Friends from "./routes/app/main/home/friends";
import HomeLayout, { homeLoader } from "./routes/app/main/home/home-layout";
import MainLayout from "./routes/app/main/main-layout";
import Index from "./routes/index";

const routes: RouteConfig = [
	index("routes/home.tsx"),
	// layout("routes/app/app-layout.tsx", [
	// 	layout("routes/app/auth/auth-layout.tsx", [
	// 		route("login", "routes/app/auth/login.tsx"),
	// 		route("register", "routes/app/auth/register.tsx"),
	// 		route("oauth-redirect", "routes/app/auth/oauth-redirect.tsx"),
	// 	]),
	// 	layout("routes/app/main/main-layout.tsx", [
	// 		layout("routes/app/main/home/home-layout.tsx", [
	// 			route("friends", "routes/app/main/home/friends.tsx"),
	// 			route("channels/@me", "routes/app/main/home/channels.@me.tsx"),
	// 			route("channels/@me/:channelId", "routes/app/main/home/channels.@me.$channelId.tsx"),
	// 		]),
	// 	]),
	// ]),
];

const router = createHashRouter([
	{
		Component: Root,
		loader: rootLoader,
		ErrorBoundary: RouteErrorComponent,
		children: [
			{
				path: "/",
				Component: Index,
			},
			{
				Component: AppLayout,
				children: [
					{
						Component: AuthLayout,
						loader: authLoader,
						children: [
							{
								path: "/login",
								Component: Login,
							},
							{
								path: "/register",
								Component: Register,
							},
							{
								path: "/oauth-redirect",
								Component: OauthRedirect,
							},
						],
					},
					{
						Component: MainLayout,
						children: [
							{
								Component: HomeLayout,
								loader: homeLoader,
								children: [
									{
										path: "/channels/@me/:channelId",
										Component: ChannelWithId,
										loader: channelWithIdLoader,
									},
									{
										path: "/channels/@me",
										Component: ChannelMe,
									},
									{
										path: "/friends",
										Component: Friends,
									},
								],
							},
						],
					},
				],
			},
		],
	},
]);

export default router;
