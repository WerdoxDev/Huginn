import type { APIChannelUser, APIReadStateWithoutUser, DirectChannel, UserPresence, UserSettings } from "./api-types";
import type { APIMessage, APIMessageUser, APIRelationshipWithoutOwner, APIUser, Tokens } from "./api-types";
import type { Snowflake } from "./snowflake";

export enum GatewayOperations {
	DISPATCH = 0,
	HEARTBEAT = 1,
	IDENTIFY = 2,
	RESUME = 6,
	INVALID_SESSION = 9,
	HELLO = 10,
	HEARTBEAT_ACK = 11,
}

export type GatewayOperationTypes = {
	[GatewayOperations.DISPATCH]: GatewayDispatch;
	[GatewayOperations.HEARTBEAT]: GatewayHeartbeat;
	[GatewayOperations.HEARTBEAT_ACK]: GatewayHeartbeatAck;
	[GatewayOperations.HELLO]: GatewayHello;
	[GatewayOperations.RESUME]: GatewayResume;
	[GatewayOperations.IDENTIFY]: GatewayIdentify;
};

export type GatewayEvents = {
	message: GatewayPayload;
	open: undefined;
	close: number;
	hello: GatewayHelloData;
	identify: GatewayIdentifyData;
	ready: GatewayReadyData;
	resumed: undefined;
	message_create: GatewayMessageCreateData;
	message_delete: GatewayMessageDeleteData;
	message_update: GatewayMessageUpdateData;
	message_ack: GatewayMessageAckData;
	typying_start: GatewayTypingStartData;
	relationship_add: GatewayRelationshipCreateData;
	relationship_remove: Snowflake;
	channel_create: GatewayDMChannelCreateData;
	channel_update: GatewayDMChannelUpdateData;
	channel_delete: GatewayDMChannelDeleteData;
	channel_recipient_add: GatewayDMCHannelRecipientAddData;
	channel_recipient_remove: GatewayDMCHannelRecipientRemoveData;
	user_update: GatewayUserUpdateData;
	presence_update: GatewayPresenceUpdateData;
	oauth_redirect: GatewayOAuthRedirectData;
};

export type GatewayPayload<Event extends keyof GatewayEvents | undefined = undefined> = {
	op: Event extends undefined ? GatewayOperations : GatewayOperations.DISPATCH;
	s: number;
} & (Event extends undefined ? { d?: unknown; t?: string } : { d: GatewayEvents[Extract<Event, keyof GatewayEvents>]; t: Event });

export type NonDispatchPayload = Omit<GatewayPayload, "s" | "t">;

// export type DataPayload<Event extends keyof GatewayEvents, D = unknown> = {
// 	op: GatewayOperations.DISPATCH;
// 	t: Event;
// 	d: D;
// } & BasePayload;

export type GatewayDispatch = {
	t: keyof GatewayEvents;
	d: GatewayEvents[keyof GatewayEvents];
} & GatewayPayload;

export type GatewayHello = NonDispatchPayload & {
	op: GatewayOperations.HELLO;
	d: GatewayHelloData;
};

export type GatewayHelloData = {
	heartbeatInterval: number;
	peerId: string;
};

export type GatewayHeartbeat = NonDispatchPayload & {
	op: GatewayOperations.HEARTBEAT;
	d: GatewayHeartbeatData;
};

export type GatewayHeartbeatData = number | undefined;

export type GatewayHeartbeatAck = NonDispatchPayload & {
	op: GatewayOperations.HEARTBEAT_ACK;
};

export type GatewayIdentify = NonDispatchPayload & {
	op: GatewayOperations.IDENTIFY;
	d: GatewayIdentifyData;
};

export type GatewayIdentifyData = {
	token: string;
	properties: GatewayIdentifyProperties;
	intents: number;
};

export type GatewayIdentifyProperties = {
	os: string;
	browser: string;
	device: string;
};

// export type GatewayReady = DataPayload<"ready", GatewayReadyData>;

export type GatewayReadyData = {
	user: APIUser;
	sessionId: Snowflake;
	relationships: APIRelationshipWithoutOwner[];
	privateChannels: DirectChannel[];
	presences: UserPresence[];
	userSettings: UserSettings;
	readStates: APIReadStateWithoutUser[];
};

export type GatewayResume = NonDispatchPayload & {
	op: GatewayOperations.RESUME;
	d: GatewayResumeData;
};

export type GatewayResumeData = {
	token: string;
	sessionId: Snowflake;
	seq: number;
};

// export type GatewayResumedData = DataPayload<"resumed", undefined>;
export type GatewayMessageCreateData = Omit<APIMessage, "mentions"> & GatewayMessageEventExtraFields;
export type GatewayMessageUpdateData = Omit<APIMessage, "mentions"> & GatewayMessageEventExtraFields;
export type GatewayMessageDeleteData = {
	id: Snowflake;
	channelId: Snowflake;
	guildId?: Snowflake;
};

type GatewayMessageEventExtraFields = {
	guildId?: Snowflake;
	// TODO: Implement Guild Member
	// member?:
	mentions: APIMessageUser[];
	// mentions: (APIUser & {member: Omit<APIGuildMember, "user">})[];
};

export type GatewayMessageAckData = { channelId: Snowflake; messageId: Snowflake };

export type GatewayRelationshipCreateData = APIRelationshipWithoutOwner;
export type GatewayDMChannelCreateData = DirectChannel;
export type GatewayDMChannelDeleteData = Omit<DirectChannel, "recipients">;
export type GatewayDMChannelUpdateData = DirectChannel;
export type GatewayDMCHannelRecipientAddData = { user: APIChannelUser; channelId: Snowflake };
export type GatewayDMCHannelRecipientRemoveData = { user: APIChannelUser; channelId: Snowflake };
export type GatewayUserUpdateData = APIUser & Tokens;
export type GatewayPresenceUpdateData = UserPresence;

export type GatewayOAuthRedirectData = {
	access_token?: string;
	refresh_token?: string;
	token?: string;
	error?: string;
};

export type GatewayTypingStartData = {
	channelId: Snowflake;
	userId: Snowflake;
	timestamp: number;
};
