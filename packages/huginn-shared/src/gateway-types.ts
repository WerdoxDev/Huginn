import { DirectChannel } from "./api-types";
import {
   APIDMChannel,
   APIGroupDMChannel,
   APIMessage,
   APIMessageUser,
   APIRelationshipWithoutOwner,
   APIUser,
   Tokens,
} from "./api-types";
import { Snowflake } from "./snowflake";

export enum GatewayOperations {
   DISPATCH = 0,
   HEARTBEAT = 1,
   IDENTIFY = 2,
   RESUME = 6,
   INVALID_SESSION = 9,
   HELLO = 10,
   HEARTBEAT_ACK = 11,
}

export type GatewayEvents = {
   open: undefined;
   close: number;
   hello: GatewayHelloData;
   identify: GatewayIdentifyData;
   ready: GatewayReadyDispatchData;
   resumed: undefined;
   message_create: GatewayMessageCreateData;
   message_delete: GatewayMessageDeleteData;
   typying_start: GatewayMessageCreateData;
   relationship_create: GatewayRelationshipCreateData;
   relationship_delete: Snowflake;
   channel_create: GatewayDMChannelCreateData;
   channel_delete: GatewayDMChannelDeleteData;
   user_update: GatewayUserUpdateData;
   public_user_update: GatewayPublicUserUpdateData;
};

export type BasePayload = {
   op: GatewayOperations;
   d?: unknown;
   s: number;
   t?: string;
};

export type NonDispatchPayload = Omit<BasePayload, "s" | "t">;

export type DataPayload<Event extends keyof GatewayEvents, D = unknown> = {
   op: GatewayOperations.DISPATCH;
   t: Event;
   d: D;
} & BasePayload;

export type GatewayDispatch = {
   t: keyof GatewayEvents;
   d: GatewayEvents[keyof GatewayEvents];
} & BasePayload;

export type GatewayHello = NonDispatchPayload & {
   op: GatewayOperations.HELLO;
   d: GatewayHelloData;
};

export type GatewayHelloData = {
   heartbeatInterval: number;
};

export type GatewayHeartbeat = NonDispatchPayload & {
   op: GatewayOperations.HEARTBEAT;
   d: GatewayHeartbeatData;
};

export type GatewayHeartbeatData = number | null;

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

export type GatewayReadyDispatch = DataPayload<"ready", GatewayReadyDispatchData>;

export type GatewayReadyDispatchData = {
   user: APIUser;
   sessionId: Snowflake;
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

export type GatewayResumedData = DataPayload<"resumed", undefined>;
export type GatewayMessageCreateData = Omit<APIMessage, "mentions"> & GatewayMessageEventExtraFields;
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

export type GatewayRelationshipCreateData = APIRelationshipWithoutOwner;
export type GatewayDMChannelCreateData = DirectChannel;
export type GatewayDMChannelDeleteData =DirectChannel;
export type GatewayUserUpdateData = APIUser & Tokens;
export type GatewayPublicUserUpdateData = Omit<APIUser, "email" | "password">;
