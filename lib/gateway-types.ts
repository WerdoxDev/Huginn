import {
   APIDMChannel,
   APIGroupDMChannel,
   APIMessage,
   APIMessageUser,
   APIRelationshipWithoutOwner,
   APIUser,
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
   close: number;
   hello: GatewayHelloData;
   identify: GatewayIdentifyData;
   ready: GatewayReadyDispatchData;
   message_create: GatewayMessageCreateDispatchData;
   message_delete: Snowflake;
   typying_start: GatewayMessageCreateDispatchData;
   relationship_create: GatewayRelationshipCreateDispatchData;
   relationship_delete: Snowflake;
   channel_create: GatewayDMChannelCreateDispatchData;
   channel_delete: GatewayDMChannelDeleteDispatchData;
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

export type GatewayMessageCreateDispatch = DataPayload<"message_create", GatewayMessageCreateDispatchData>;

export type GatewayMessageCreateDispatchData = Omit<APIMessage, "mentions"> & GatewayMessageEventExtraFields;

export type GatewayMessageEventExtraFields = {
   guildId?: Snowflake;
   // TODO: Implement Guild Member
   // member?:
   mentions: APIMessageUser[];
   // mentions: (APIUser & {member: Omit<APIGuildMember, "user">})[];
};

// RELATIONSHIP_CREATE
export type GatewayRelationshipCreateDispatch = DataPayload<
   "relationship_create",
   GatewayRelationshipCreateDispatchData
>;

export type GatewayRelationshipCreateDispatchData = APIRelationshipWithoutOwner;

// RELATIONSHIP_DELETE
export type GatewayRelationshipDeleteDispatch = DataPayload<"relationship_delete", Snowflake>;

// DM_CHANNEL_CREATE
export type GatewayDMChannelCreateDispatch = DataPayload<"channel_create", GatewayDMChannelCreateDispatchData>;

export type GatewayDMChannelCreateDispatchData = APIDMChannel | APIGroupDMChannel;

// DM_CHANNEL_DELETE
export type GatewayDMChannelDeleteDispatch = DataPayload<"channel_delete", GatewayDMChannelDeleteDispatchData>;

export type GatewayDMChannelDeleteDispatchData = APIDMChannel | APIGroupDMChannel;
