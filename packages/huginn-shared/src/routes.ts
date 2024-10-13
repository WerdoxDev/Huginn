import type { Snowflake } from "./snowflake";

export type RouteLike = `/${string}`;

export const Routes = {
	/**
	 * Route for:
	 * - POST '/auth/login'
	 */
	login() {
		return "/auth/login" as const;
	},

	/**
	 * Route for:
	 * - POST '/auth/register'
	 */
	register() {
		return "/auth/register" as const;
	},

	/**
	 * Route for:
	 * - POST '/auth/logout'
	 */
	logout() {
		return "/auth/logout" as const;
	},

	/**
	 * Route for:
	 * - POST '/auth/refresh-token'
	 */
	refreshToken() {
		return "/auth/refresh-token" as const;
	},

	/**
	 * ROute for:
	 * - POST '/unique-username'
	 */
	uniqueUsername() {
		return "/unique-username" as const;
	},

	/**
	 * Route for:
	 * - GET   '/users/@me'
	 * - GET   '/users/{user.id}'
	 * - PATCH '/users/@me'
	 */
	user(id: Snowflake): `/users/${string}` {
		return `/users/${id}` as const;
	},

	/**
	 * Route for:
	 * - POST '/users/@me/channels'
	 * - GET  '/users/@me/channels'
	 */
	userChannels() {
		return "/users/@me/channels" as const;
	},

	/**
	 * Route for:
	 * - GET    '/users/@me/relationships'
	 * - POST   '/users/@me/relationships'
	 */
	userRelationships() {
		return "/users/@me/relationships" as const;
	},

	/**
	 * Route for:
	 * - GET    '/users/@me/relationships/{user.id}'
	 * - DELETE '/users/@me/relationships/{user.id}'
	 * - PUT    '/users/@me/relationships/{user.id}'
	 */
	userRelationship(id: string): `/users/@me/relationships/${string}` {
		return `/users/@me/relationships/${id}` as const;
	},

	/**
	 * Route for:
	 * - GET '/channels/{channel.id}'
	 */
	channel(id: Snowflake): `/channels/${string}` {
		return `/channels/${id}` as const;
	},

	/**
	 * Route for:
	 * - GET '/channels/{channel.id}/messages/{message.id}'
	 */
	channelMessage(channelId: Snowflake, messageId: Snowflake): `/channels/${string}/messages/${string}` {
		return `/channels/${channelId}/messages/${messageId}` as const;
	},

	/**
	 * Route for:
	 * - GET '/channels/{channel.id}/messages'
	 */
	channelMessages(channelId: Snowflake): `/channels/${string}/messages` {
		return `/channels/${channelId}/messages` as const;
	},

	/**
	 * Route for:
	 * - POST '/channels/{channel.id}/typing'
	 */
	channelTyping(channelId: Snowflake): `/channels/${string}/typing` {
		return `/channels/${channelId}/typing` as const;
	},
};

export const CDNRoutes = {
	/**
	 * Route for:
	 * - POST '/avatars/{user.id}'
	 */
	uploadAvatar(userId: Snowflake): `/avatars/${string}` {
		return `/avatars/${userId}` as const;
	},

	/**
	 * Route for:
	 * - POST '/channel-icons/{channel.id}'
	 */
	uploadChannelIcon(channelId: Snowflake): `/channel-icons/${string}` {
		return `/channel-icons/${channelId}` as const;
	},
};
