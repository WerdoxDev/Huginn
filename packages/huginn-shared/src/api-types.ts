import type { Merge } from "@huginn/shared";
import type { Snowflake } from "./snowflake";

export type LoginCredentials = APIPostLoginJSONBody;
export type RegisterUser = APIPostRegisterJSONBody;

export type DirectChannel = Merge<APIDMChannel, APIGroupDMChannel>;

export type TokenPayload = {
	id: Snowflake;
	isOAuth: boolean;
};

export type IdentityTokenPayload = {
	providerId: Snowflake;
	providerUserId: Snowflake;
	username: string;
	email: string;
	fullName: string;
	avatarHash: string | null;
};

//#region USER
type APIBaseUser = {
	id: Snowflake;
};

export enum UserFlags {
	NONE = 0,
	STAFF = 1 << 0,
	BUG_HUNTER = 1 << 1,
	EARLY_HUGINN_SUPPORTER = 1 << 2,
}

export type APIUser = {
	username: string;
	displayName: string | null;
	avatar: string | null;
	system?: boolean;
	email: string;
	password?: string | null;
	// TODO: Actually implement flags
	flags: UserFlags;
} & APIBaseUser;

export type APIPublicUser = {
	username: string;
	displayName: string | null;
	avatar: string | null;
	flags: UserFlags;
} & APIBaseUser;

export type APIChannelUser = APIPublicUser;
export type APIMessageUser = APIPublicUser;
export type APIRelationUser = APIPublicUser;

export type Tokens = {
	token: string;
	refreshToken: string;
};

export type APIGetUserResult = APIUser;
export type APIGetCurrentUserResult = APIUser;
export type APIGetUserByIdResult = APIPublicUser;

export type APIPostRefreshTokenJSONBody = {
	refreshToken: string;
};

export type APIPostRefreshTokenResult = Tokens;

export type APIPostLoginJSONBody = {
	email?: string;
	username?: string;
	password: string;
};

export type APIPostRegisterJSONBody = {
	username: string;
	displayName: string | null;
	email: string;
	password: string;
};

export type APIPatchCurrentUserJSONBody = {
	email?: string;
	displayName?: string | null;
	username?: string;
	avatar?: string | null;
	password?: string;
	newPassword?: string;
};

export type APIPostOAuthConfirmJSONBody = {
	username: string;
	displayName: string | null;
	avatar: string | null;
};

export type APIPostLoginResult = APIUser & Tokens;
export type APIPostRegisterResult = APIUser & Tokens;
export type APIPatchCurrentUserResult = APIUser & Tokens;
export type APIPostOAuthConfirmResult = APIUser & Tokens;

export type APIPostUniqueUsernameJSONBody = {
	username: string;
};

export type APIPostUniqueUsernameResult = {
	taken: boolean;
};
//#endregion

//#region RELATIONSHIP
export type APIRelationship = {
	id: Snowflake;
	type: RelationshipType;
	nickname: string;
	since: Date | null;
	user: APIRelationUser;
	owner: APIRelationUser;
};

export type APIRelationshipWithoutOwner = Omit<APIRelationship, "owner">;

export enum RelationshipType {
	NONE = 0,
	FRIEND = 1,
	BLOCKED = 2,
	PENDING_INCOMING = 3,
	PENDING_OUTGOING = 4,
}

export type APIGetUserRelationshipsResult = APIRelationshipWithoutOwner[];
export type APIGetUserRelationshipByIdResult = APIRelationshipWithoutOwner;

export type APIPostRelationshipJSONBody = {
	username: string;
};
//#endregion

//#region CHANNEL
type APIBaseChannel = {
	id: Snowflake;
	type: ChannelType;
};

export type APIChannel = {
	name?: string | null;
	ownerId?: Snowflake | null;
	icon?: string | null;
	lastMessageId?: Snowflake | null;
	recipients?: APIChannelUser[];
} & APIBaseChannel;

export type APIDMChannel = {
	type: ChannelType.DM;
	lastMessageId?: Snowflake | null;
	recipients: APIChannelUser[];
} & APIBaseChannel;

export type APIGroupDMChannel = {
	type: ChannelType.GROUP_DM;
	name: string;
	icon: string | null;
	ownerId: Snowflake;
	lastMessageId?: Snowflake | null;
	recipients: APIChannelUser[];
} & APIBaseChannel;

export enum ChannelType {
	DM = 0,
	GROUP_DM = 1,
	GUILD_TEXT = 2,
	GUILD_VOICE = 3,
	GUILD_CATEGORY = 4,
}

export type APIPostDMChannelJSONBody = {
	name?: string;
	recipients: Snowflake[];
};

export type APIPatchDMChannelJSONBody = {
	name?: string | null;
	icon?: string | null;
	owner?: string;
};

export type APIGetChannelByIdResult = APIChannel;
export type APIPostDMChannelResult = DirectChannel;
export type APIPatchDMChannelResult = DirectChannel;
export type APIDeleteDMChannelResult = DirectChannel;
export type APIGetUserChannelsResult = DirectChannel[];
//#endregion

//#region MESSAGE
type APIBaseMessage = {
	id: Snowflake;
	type: MessageType;
	channelId: Snowflake;
	author: APIMessageUser;
	content: string;
	timestamp: Date | string;
	editedTimestamp: Date | string | null;
	attachments: APIAttachment[];
	embeds: APIEmbed[];
	pinned: boolean;
	mentions: APIMessageUser[];
	flags?: MessageFlags | null;
	nonce?: number | string;
	reactions?: string[];
};

export type APIMessage = APICallMessage | APIDefaultMessage;

export enum MessageFlags {
	NONE = 0,
	SUPPRESS_NOTIFICATIONS = 1 << 0,
	SUPPRESS_EMBEDS = 1 << 1,
	URGENT = 1 << 2,
	EPHEMERAL = 1 << 3,
	LOADING = 1 << 4,
}

export type APIDefaultMessage = {
	type:
		| MessageType.DEFAULT
		| MessageType.RECIPIENT_ADD
		| MessageType.RECIPIENT_REMOVE
		| MessageType.CHANNEL_ICON_CHANGED
		| MessageType.CHANNEL_NAME_CHANGED
		| MessageType.CHANNEL_OWNER_CHANGED;
} & APIBaseMessage;

export type APICallMessage = {
	type: MessageType.CALL;
	call: APIMessageCall;
} & APIBaseMessage;

export type APIMessageCall = { participants: Snowflake[]; endedTimestamp: Date | string | null };

export type APIPostDefaultMessageJSONBody = {
	content?: string;
	attachments?: APIPostAttachmentJSONBody[];
	embeds?: APIEmbed[];
	flags?: MessageFlags;
	nonce?: number | string;
};

export type APIEmbed = {
	title?: string;
	type: "rich" | "video" | "image" | (string & {});
	description?: string;
	url?: string;
	timestamp?: string;
	thumbnail?: APIThumbnail;
	video?: APIVideo;
};

export type APIThumbnail = {
	url: string;
	width?: number;
	height?: number;
};

export type APIVideo = {
	url: string;
	width?: number;
	height?: number;
};

export type APIPostAttachmentJSONBody = {
	id: number;
	description?: string;
	filename: string;
};

export type APIAttachment = {
	id: Snowflake;
	description?: string;
	filename: string;
	width?: number;
	height?: number;
	contentType: string;
	url: string;
	size: number;
	flags: number;
};

export type APIPostDefaultMessageResult = APIDefaultMessage;
export type APIGetMessageByIdResult = APIMessage;
export type APIGetChannelMessagesResult = APIMessage[];
export type APIRelease = {
	version: string;
	date: string;
	url: string;
	description?: string;
	windowsSetupUrl?: string;
	macosSetupUrl?: string;
	linuxSetupUrl?: string;
};
export type APIGetLatestReleaseResult = APIRelease | undefined;
export type APIGetAllReleasesResult = APIRelease[];

export type APICheckUpdateResult = {
	version: string;
	pub_date: string;
	url: string;
	signature: string;
	notes: string;
};

export enum MessageType {
	DEFAULT = 0,
	RECIPIENT_ADD = 1,
	RECIPIENT_REMOVE = 2,
	CALL = 3,
	CHANNEL_NAME_CHANGED = 4,
	CHANNEL_ICON_CHANGED = 5,
	CHANNEL_PINNED_MESSAGE = 6,
	CHANNEL_OWNER_CHANGED = 7,
	USER_JOIN = 7,
	REPLY = 8,
}
//#endregion

export type PresenceStatus = "offline" | "online" | "dnd" | "idle";
export type UserPresence = {
	user: PresenceUser;
	status: PresenceStatus;
};

export type PresenceUser = Partial<APIPublicUser> & { id: Snowflake };

export type UserSettings = {
	status: PresenceStatus;
};

export type OAuthType = "google" | "github";
export type OAuthFlow = "browser" | "websocket";

export type APIReadState = {
	userId: Snowflake;
	channelId: Snowflake;
	lastReadMessageId: Snowflake | null;
	unreadCount: number;
};

export type APIReadStateWithoutUser = Omit<APIReadState, "userId">;
