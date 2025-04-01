import type { APIChannelUser, APIReadStateWithoutUser, DirectChannel, UserPresence, UserSettings } from "./api-types";
import type { APIMessage, APIMessageUser, APIRelationshipWithoutOwner, APIUser, Tokens } from "./api-types";
import type { Snowflake } from "./snowflake";

export enum GatewayOperations {
	HELLO = 0,
	IDENTIFY = 1,
	HEARTBEAT = 2,
	HEARTBEAT_ACK = 3,
	DISPATCH = 4,
	RESUME = 5,
	VOICE_STATE_UPDATE = 6,
}

export type GatewayOperationTypes = {
	[GatewayOperations.HELLO]: GatewayHello;
	[GatewayOperations.IDENTIFY]: GatewayIdentify;
	[GatewayOperations.HEARTBEAT]: GatewayHeartbeat;
	[GatewayOperations.HEARTBEAT_ACK]: GatewayHeartbeatAck;
	[GatewayOperations.DISPATCH]: GatewayDispatch;
	[GatewayOperations.RESUME]: GatewayResume;
	[GatewayOperations.VOICE_STATE_UPDATE]: GatewayUpdateVoiceState;
};

export type GatewayEvents = {
	message: GatewayPayload;
	open: undefined;
	close: number;
	hello: GatewayHelloData;
	identify: GatewayIdentifyData;
	ready: GatewayReadyData;
	resumed: GatewayResumedData;
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
	channel_recipient_add: GatewayDMChannelRecipientAddData;
	channel_recipient_remove: GatewayDMCannelRecipientRemoveData;
	user_update: GatewayUserUpdateData;
	presence_update: GatewayPresenceUpdateData;
	oauth_redirect: GatewayOAuthRedirectData;
	voice_state_update: GatewayVoiceStateUpdateData;
	voice_server_update: GatewayVoiceServerUpdateData;
};

export type GatewayPayload<Event extends keyof GatewayEvents | undefined = undefined> = {
	op: Event extends undefined ? GatewayOperations : GatewayOperations.DISPATCH;
	s: number;
} & (Event extends undefined ? { d?: unknown; t?: string } : { d: GatewayEvents[Extract<Event, keyof GatewayEvents>]; t: Event });

export type NonDispatchGatewayPayload = Omit<GatewayPayload, "s" | "t">;

// export type DataPayload<Event extends keyof GatewayEvents, D = unknown> = {
// 	op: GatewayOperations.DISPATCH;
// 	t: Event;
// 	d: D;
// } & BasePayload;

export type GatewayDispatch = {
	t: keyof GatewayEvents;
	d: GatewayEvents[keyof GatewayEvents];
} & GatewayPayload;

export type GatewayHello = NonDispatchGatewayPayload & {
	op: GatewayOperations.HELLO;
	d: GatewayHelloData;
};

export type GatewayHelloData = {
	heartbeatInterval: number;
	sessionId: string;
};

export type GatewayHeartbeat = NonDispatchGatewayPayload & {
	op: GatewayOperations.HEARTBEAT;
	d: GatewayHeartbeatData;
};

export type GatewayHeartbeatData = number | undefined;

export type GatewayHeartbeatAck = NonDispatchGatewayPayload & {
	op: GatewayOperations.HEARTBEAT_ACK;
};

export type GatewayIdentify = NonDispatchGatewayPayload & {
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

export type GatewayReadyData = {
	user: APIUser;
	relationships: APIRelationshipWithoutOwner[];
	privateChannels: DirectChannel[];
	presences: UserPresence[];
	userSettings: UserSettings;
	readStates: APIReadStateWithoutUser[];
};

export type GatewayResume = NonDispatchGatewayPayload & {
	op: GatewayOperations.RESUME;
	d: GatewayResumeData;
};

export type GatewayResumeData = {
	token: string;
	sessionId: string;
	seq: number;
};

export type GatewayResumedData = {
	sessionId: string;
};

export type GatewayUpdateVoiceStateData = {
	guildId: Snowflake | null;
	channelId: Snowflake | null;
	selfMute: boolean;
	selfDeaf: boolean;
};

export type GatewayUpdateVoiceState = NonDispatchGatewayPayload & {
	op: GatewayOperations.VOICE_STATE_UPDATE;
	d: GatewayUpdateVoiceStateData;
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
export type GatewayDMChannelRecipientAddData = { user: APIChannelUser; channelId: Snowflake };
export type GatewayDMCannelRecipientRemoveData = { user: APIChannelUser; channelId: Snowflake };
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

export type GatewayVoiceStateUpdateData = {
	userId: Snowflake;
	guildId: Snowflake | null;
	channelId: Snowflake | null;
	selfMute: boolean;
	selfDeaf: boolean;
	selfVideo: boolean;
	selfStream: boolean;
};

export type GatewayVoiceServerUpdateData = {
	token: string;
	hostname: string;
};
