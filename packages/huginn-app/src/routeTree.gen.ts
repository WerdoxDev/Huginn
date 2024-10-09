/* prettier-ignore-start */

/* eslint-disable */

// @ts-nocheck

// noinspection JSUnusedGlobalSymbols

// This file is auto-generated by TanStack Router

// Import Routes

import { Route as rootRoute } from "./routes/__root";
import { Route as SplashscreenImport } from "./routes/splashscreen";
import { Route as LayoutAnimationImport } from "./routes/_layoutAnimation";
import { Route as LayoutAnimationLayoutMainImport } from "./routes/_layoutAnimation/_layoutMain";
import { Route as LayoutAnimationLayoutAuthImport } from "./routes/_layoutAnimation/_layoutAuth";
import { Route as LayoutAnimationLayoutMainLayoutHomeImport } from "./routes/_layoutAnimation/_layoutMain/_layoutHome";
import { Route as LayoutAnimationLayoutAuthRegisterImport } from "./routes/_layoutAnimation/_layoutAuth/register";
import { Route as LayoutAnimationLayoutAuthLoginImport } from "./routes/_layoutAnimation/_layoutAuth/login";
import { Route as LayoutAnimationLayoutMainLayoutHomeFriendsImport } from "./routes/_layoutAnimation/_layoutMain/_layoutHome/friends";
import { Route as LayoutAnimationLayoutMainLayoutHomeChannelsmeImport } from "./routes/_layoutAnimation/_layoutMain/_layoutHome/channels.@me";
import { Route as LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdImport } from "./routes/_layoutAnimation/_layoutMain/_layoutHome/channels.@me.$channelId";

// Create/Update Routes

const SplashscreenRoute = SplashscreenImport.update({
	path: "/splashscreen",
	getParentRoute: () => rootRoute,
} as any);

const LayoutAnimationRoute = LayoutAnimationImport.update({
	id: "/_layoutAnimation",
	getParentRoute: () => rootRoute,
} as any);

const LayoutAnimationLayoutMainRoute = LayoutAnimationLayoutMainImport.update({
	id: "/_layoutMain",
	getParentRoute: () => LayoutAnimationRoute,
} as any);

const LayoutAnimationLayoutAuthRoute = LayoutAnimationLayoutAuthImport.update({
	id: "/_layoutAuth",
	getParentRoute: () => LayoutAnimationRoute,
} as any);

const LayoutAnimationLayoutMainLayoutHomeRoute = LayoutAnimationLayoutMainLayoutHomeImport.update({
	id: "/_layoutHome",
	getParentRoute: () => LayoutAnimationLayoutMainRoute,
} as any);

const LayoutAnimationLayoutAuthRegisterRoute = LayoutAnimationLayoutAuthRegisterImport.update({
	path: "/register",
	getParentRoute: () => LayoutAnimationLayoutAuthRoute,
} as any);

const LayoutAnimationLayoutAuthLoginRoute = LayoutAnimationLayoutAuthLoginImport.update({
	path: "/login",
	getParentRoute: () => LayoutAnimationLayoutAuthRoute,
} as any);

const LayoutAnimationLayoutMainLayoutHomeFriendsRoute = LayoutAnimationLayoutMainLayoutHomeFriendsImport.update({
	path: "/friends",
	getParentRoute: () => LayoutAnimationLayoutMainLayoutHomeRoute,
} as any);

const LayoutAnimationLayoutMainLayoutHomeChannelsmeRoute = LayoutAnimationLayoutMainLayoutHomeChannelsmeImport.update({
	path: "/channels/@me",
	getParentRoute: () => LayoutAnimationLayoutMainLayoutHomeRoute,
} as any);

const LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute = LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdImport.update({
	path: "/$channelId",
	getParentRoute: () => LayoutAnimationLayoutMainLayoutHomeChannelsmeRoute,
} as any);

// Populate the FileRoutesByPath interface

declare module "@tanstack/react-router" {
	interface FileRoutesByPath {
		"/_layoutAnimation": {
			id: "/_layoutAnimation";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof LayoutAnimationImport;
			parentRoute: typeof rootRoute;
		};
		"/splashscreen": {
			id: "/splashscreen";
			path: "/splashscreen";
			fullPath: "/splashscreen";
			preLoaderRoute: typeof SplashscreenImport;
			parentRoute: typeof rootRoute;
		};
		"/_layoutAnimation/_layoutAuth": {
			id: "/_layoutAnimation/_layoutAuth";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof LayoutAnimationLayoutAuthImport;
			parentRoute: typeof LayoutAnimationImport;
		};
		"/_layoutAnimation/_layoutMain": {
			id: "/_layoutAnimation/_layoutMain";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof LayoutAnimationLayoutMainImport;
			parentRoute: typeof LayoutAnimationImport;
		};
		"/_layoutAnimation/_layoutAuth/login": {
			id: "/_layoutAnimation/_layoutAuth/login";
			path: "/login";
			fullPath: "/login";
			preLoaderRoute: typeof LayoutAnimationLayoutAuthLoginImport;
			parentRoute: typeof LayoutAnimationLayoutAuthImport;
		};
		"/_layoutAnimation/_layoutAuth/register": {
			id: "/_layoutAnimation/_layoutAuth/register";
			path: "/register";
			fullPath: "/register";
			preLoaderRoute: typeof LayoutAnimationLayoutAuthRegisterImport;
			parentRoute: typeof LayoutAnimationLayoutAuthImport;
		};
		"/_layoutAnimation/_layoutMain/_layoutHome": {
			id: "/_layoutAnimation/_layoutMain/_layoutHome";
			path: "";
			fullPath: "";
			preLoaderRoute: typeof LayoutAnimationLayoutMainLayoutHomeImport;
			parentRoute: typeof LayoutAnimationLayoutMainImport;
		};
		"/_layoutAnimation/_layoutMain/_layoutHome/friends": {
			id: "/_layoutAnimation/_layoutMain/_layoutHome/friends";
			path: "/friends";
			fullPath: "/friends";
			preLoaderRoute: typeof LayoutAnimationLayoutMainLayoutHomeFriendsImport;
			parentRoute: typeof LayoutAnimationLayoutMainLayoutHomeImport;
		};
		"/_layoutAnimation/_layoutMain/_layoutHome/channels/@me": {
			id: "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me";
			path: "/channels/@me";
			fullPath: "/channels/@me";
			preLoaderRoute: typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeImport;
			parentRoute: typeof LayoutAnimationLayoutMainLayoutHomeImport;
		};
		"/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId": {
			id: "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId";
			path: "/$channelId";
			fullPath: "/channels/@me/$channelId";
			preLoaderRoute: typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdImport;
			parentRoute: typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeImport;
		};
	}
}

// Create and export the route tree

interface LayoutAnimationLayoutAuthRouteChildren {
	LayoutAnimationLayoutAuthLoginRoute: typeof LayoutAnimationLayoutAuthLoginRoute;
	LayoutAnimationLayoutAuthRegisterRoute: typeof LayoutAnimationLayoutAuthRegisterRoute;
}

const LayoutAnimationLayoutAuthRouteChildren: LayoutAnimationLayoutAuthRouteChildren = {
	LayoutAnimationLayoutAuthLoginRoute: LayoutAnimationLayoutAuthLoginRoute,
	LayoutAnimationLayoutAuthRegisterRoute: LayoutAnimationLayoutAuthRegisterRoute,
};

const LayoutAnimationLayoutAuthRouteWithChildren = LayoutAnimationLayoutAuthRoute._addFileChildren(LayoutAnimationLayoutAuthRouteChildren);

interface LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteChildren {
	LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute: typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute;
}

const LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteChildren: LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteChildren = {
	LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute: LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute,
};

const LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren = LayoutAnimationLayoutMainLayoutHomeChannelsmeRoute._addFileChildren(
	LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteChildren,
);

interface LayoutAnimationLayoutMainLayoutHomeRouteChildren {
	LayoutAnimationLayoutMainLayoutHomeFriendsRoute: typeof LayoutAnimationLayoutMainLayoutHomeFriendsRoute;
	LayoutAnimationLayoutMainLayoutHomeChannelsmeRoute: typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren;
}

const LayoutAnimationLayoutMainLayoutHomeRouteChildren: LayoutAnimationLayoutMainLayoutHomeRouteChildren = {
	LayoutAnimationLayoutMainLayoutHomeFriendsRoute: LayoutAnimationLayoutMainLayoutHomeFriendsRoute,
	LayoutAnimationLayoutMainLayoutHomeChannelsmeRoute: LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren,
};

const LayoutAnimationLayoutMainLayoutHomeRouteWithChildren = LayoutAnimationLayoutMainLayoutHomeRoute._addFileChildren(
	LayoutAnimationLayoutMainLayoutHomeRouteChildren,
);

interface LayoutAnimationLayoutMainRouteChildren {
	LayoutAnimationLayoutMainLayoutHomeRoute: typeof LayoutAnimationLayoutMainLayoutHomeRouteWithChildren;
}

const LayoutAnimationLayoutMainRouteChildren: LayoutAnimationLayoutMainRouteChildren = {
	LayoutAnimationLayoutMainLayoutHomeRoute: LayoutAnimationLayoutMainLayoutHomeRouteWithChildren,
};

const LayoutAnimationLayoutMainRouteWithChildren = LayoutAnimationLayoutMainRoute._addFileChildren(LayoutAnimationLayoutMainRouteChildren);

interface LayoutAnimationRouteChildren {
	LayoutAnimationLayoutAuthRoute: typeof LayoutAnimationLayoutAuthRouteWithChildren;
	LayoutAnimationLayoutMainRoute: typeof LayoutAnimationLayoutMainRouteWithChildren;
}

const LayoutAnimationRouteChildren: LayoutAnimationRouteChildren = {
	LayoutAnimationLayoutAuthRoute: LayoutAnimationLayoutAuthRouteWithChildren,
	LayoutAnimationLayoutMainRoute: LayoutAnimationLayoutMainRouteWithChildren,
};

const LayoutAnimationRouteWithChildren = LayoutAnimationRoute._addFileChildren(LayoutAnimationRouteChildren);

export interface FileRoutesByFullPath {
	"": typeof LayoutAnimationLayoutMainLayoutHomeRouteWithChildren;
	"/splashscreen": typeof SplashscreenRoute;
	"/login": typeof LayoutAnimationLayoutAuthLoginRoute;
	"/register": typeof LayoutAnimationLayoutAuthRegisterRoute;
	"/friends": typeof LayoutAnimationLayoutMainLayoutHomeFriendsRoute;
	"/channels/@me": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren;
	"/channels/@me/$channelId": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute;
}

export interface FileRoutesByTo {
	"": typeof LayoutAnimationLayoutMainLayoutHomeRouteWithChildren;
	"/splashscreen": typeof SplashscreenRoute;
	"/login": typeof LayoutAnimationLayoutAuthLoginRoute;
	"/register": typeof LayoutAnimationLayoutAuthRegisterRoute;
	"/friends": typeof LayoutAnimationLayoutMainLayoutHomeFriendsRoute;
	"/channels/@me": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren;
	"/channels/@me/$channelId": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute;
}

export interface FileRoutesById {
	__root__: typeof rootRoute;
	"/_layoutAnimation": typeof LayoutAnimationRouteWithChildren;
	"/splashscreen": typeof SplashscreenRoute;
	"/_layoutAnimation/_layoutAuth": typeof LayoutAnimationLayoutAuthRouteWithChildren;
	"/_layoutAnimation/_layoutMain": typeof LayoutAnimationLayoutMainRouteWithChildren;
	"/_layoutAnimation/_layoutAuth/login": typeof LayoutAnimationLayoutAuthLoginRoute;
	"/_layoutAnimation/_layoutAuth/register": typeof LayoutAnimationLayoutAuthRegisterRoute;
	"/_layoutAnimation/_layoutMain/_layoutHome": typeof LayoutAnimationLayoutMainLayoutHomeRouteWithChildren;
	"/_layoutAnimation/_layoutMain/_layoutHome/friends": typeof LayoutAnimationLayoutMainLayoutHomeFriendsRoute;
	"/_layoutAnimation/_layoutMain/_layoutHome/channels/@me": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeRouteWithChildren;
	"/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId": typeof LayoutAnimationLayoutMainLayoutHomeChannelsmeChannelIdRoute;
}

export interface FileRouteTypes {
	fileRoutesByFullPath: FileRoutesByFullPath;
	fullPaths: "" | "/splashscreen" | "/login" | "/register" | "/friends" | "/channels/@me" | "/channels/@me/$channelId";
	fileRoutesByTo: FileRoutesByTo;
	to: "" | "/splashscreen" | "/login" | "/register" | "/friends" | "/channels/@me" | "/channels/@me/$channelId";
	id:
		| "__root__"
		| "/_layoutAnimation"
		| "/splashscreen"
		| "/_layoutAnimation/_layoutAuth"
		| "/_layoutAnimation/_layoutMain"
		| "/_layoutAnimation/_layoutAuth/login"
		| "/_layoutAnimation/_layoutAuth/register"
		| "/_layoutAnimation/_layoutMain/_layoutHome"
		| "/_layoutAnimation/_layoutMain/_layoutHome/friends"
		| "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me"
		| "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId";
	fileRoutesById: FileRoutesById;
}

export interface RootRouteChildren {
	LayoutAnimationRoute: typeof LayoutAnimationRouteWithChildren;
	SplashscreenRoute: typeof SplashscreenRoute;
}

const rootRouteChildren: RootRouteChildren = {
	LayoutAnimationRoute: LayoutAnimationRouteWithChildren,
	SplashscreenRoute: SplashscreenRoute,
};

export const routeTree = rootRoute._addFileChildren(rootRouteChildren)._addFileTypes<FileRouteTypes>();

/* prettier-ignore-end */

/* ROUTE_MANIFEST_START
{
  "routes": {
    "__root__": {
      "filePath": "__root.tsx",
      "children": [
        "/_layoutAnimation",
        "/splashscreen"
      ]
    },
    "/_layoutAnimation": {
      "filePath": "_layoutAnimation.tsx",
      "children": [
        "/_layoutAnimation/_layoutAuth",
        "/_layoutAnimation/_layoutMain"
      ]
    },
    "/splashscreen": {
      "filePath": "splashscreen.tsx"
    },
    "/_layoutAnimation/_layoutAuth": {
      "filePath": "_layoutAnimation/_layoutAuth.tsx",
      "parent": "/_layoutAnimation",
      "children": [
        "/_layoutAnimation/_layoutAuth/login",
        "/_layoutAnimation/_layoutAuth/register"
      ]
    },
    "/_layoutAnimation/_layoutMain": {
      "filePath": "_layoutAnimation/_layoutMain.tsx",
      "parent": "/_layoutAnimation",
      "children": [
        "/_layoutAnimation/_layoutMain/_layoutHome"
      ]
    },
    "/_layoutAnimation/_layoutAuth/login": {
      "filePath": "_layoutAnimation/_layoutAuth/login.tsx",
      "parent": "/_layoutAnimation/_layoutAuth"
    },
    "/_layoutAnimation/_layoutAuth/register": {
      "filePath": "_layoutAnimation/_layoutAuth/register.tsx",
      "parent": "/_layoutAnimation/_layoutAuth"
    },
    "/_layoutAnimation/_layoutMain/_layoutHome": {
      "filePath": "_layoutAnimation/_layoutMain/_layoutHome.tsx",
      "parent": "/_layoutAnimation/_layoutMain",
      "children": [
        "/_layoutAnimation/_layoutMain/_layoutHome/friends",
        "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me"
      ]
    },
    "/_layoutAnimation/_layoutMain/_layoutHome/friends": {
      "filePath": "_layoutAnimation/_layoutMain/_layoutHome/friends.tsx",
      "parent": "/_layoutAnimation/_layoutMain/_layoutHome"
    },
    "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me": {
      "filePath": "_layoutAnimation/_layoutMain/_layoutHome/channels.@me.tsx",
      "parent": "/_layoutAnimation/_layoutMain/_layoutHome",
      "children": [
        "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId"
      ]
    },
    "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me/$channelId": {
      "filePath": "_layoutAnimation/_layoutMain/_layoutHome/channels.@me.$channelId.tsx",
      "parent": "/_layoutAnimation/_layoutMain/_layoutHome/channels/@me"
    }
  }
}
ROUTE_MANIFEST_END */
