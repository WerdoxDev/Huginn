import type {
   Activity,
   APIChannelUser,
   APIMessage,
   APIReadStateWithoutUser,
   APIRelationshipWithoutOwner,
   APIUser,
   DirectChannel,
   PresenceStatus,
   Tokens,
   UserPresence,
   UserSettings,
} from "./api-types";
import type { Snowflake } from "./snowflake";

export type GatewayStatus = "disconnected" | "connecting" | "connected" | "authenticated" | "reconnecting" | "none" | "opening";

export enum GatewayOperations {
   HELLO = 0,
   IDENTIFY = 1,
   HEARTBEAT = 2,
   HEARTBEAT_ACK = 3,
   DISPATCH = 4,
   RESUME = 5,
   VOICE_STATE_UPDATE = 6,
   PRESENCE_UPDATE = 7,
}

export type GatewayOperationTypes = {
   [GatewayOperations.HELLO]: GatewayHello;
   [GatewayOperations.IDENTIFY]: GatewayIdentify;
   [GatewayOperations.HEARTBEAT]: GatewayHeartbeat;
   [GatewayOperations.HEARTBEAT_ACK]: GatewayHeartbeatAck;
   [GatewayOperations.DISPATCH]: GatewayDispatch;
   [GatewayOperations.PRESENCE_UPDATE]: GatewayUpdatePresence;
   [GatewayOperations.VOICE_STATE_UPDATE]: GatewayUpdateVoiceState;
   [GatewayOperations.RESUME]: GatewayResume;
};

export type GatewayWebsocketEvents = {
   message: GatewayPayload;
   send: GatewayPayload;
   open: undefined;
   close: number;
   status_changed: GatewayStatus;
   hello: GatewayHelloData;
   identify: GatewayIdentifyData;
   ready: GatewayReadyData;
   resumed: undefined;
   message_create: GatewayMessageCreateData;
   message_delete: GatewayMessageDeleteData;
   message_update: GatewayMessageUpdateData;
   message_ack: GatewayMessageAckData;
   typing_start: GatewayTypingStartData;
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
   call_create: GatewayCallCreateData;
   call_update: GatewayCallUpdateData;
   call_delete: GatewayCallDeleteData;
   settings_update: GatewaySettingsUpdateData;
   session_update: GatewaySessionUpdateData;
};

export type GatewayPayload<Event extends keyof GatewayWebsocketEvents | undefined = undefined> = Event extends undefined
   ? {
        [K in keyof GatewayOperationTypes]: GatewayOperationTypes[K]["op"] extends GatewayOperations.DISPATCH
           ? GatewayDispatch
           : {
                op: K;
                // biome-ignore lint/complexity/noBannedTypes: it's required here
             } & ("d" extends keyof GatewayOperationTypes[K] ? { d: GatewayOperationTypes[K]["d"] } : {}) &
                ("s" extends keyof GatewayOperationTypes[K] ? { s: number } : {}) &
                ("t" extends keyof GatewayOperationTypes[K] ? { t: string } : {});
     }[keyof GatewayOperationTypes]
   : {
        op: GatewayOperations.DISPATCH;
        s: number;
        d: GatewayWebsocketEvents[Extract<Event, keyof GatewayWebsocketEvents>];
        t: Event;
     };

export type GatewayDispatch = {
   [K in keyof GatewayWebsocketEvents]: {
      op: GatewayOperations.DISPATCH;
      s: number;
      t: K;
      d: GatewayWebsocketEvents[K];
   };
}[keyof GatewayWebsocketEvents];

export type GatewayHello = {
   op: GatewayOperations.HELLO;
   d: GatewayHelloData;
};

export type GatewayHelloData = {
   heartbeatInterval: number;
   sessionId: string;
};

export type GatewayHeartbeat = {
   op: GatewayOperations.HEARTBEAT;
   d: GatewayHeartbeatData;
};

export type GatewayHeartbeatData = number | undefined;

export type GatewayHeartbeatAck = {
   op: GatewayOperations.HEARTBEAT_ACK;
};

export type GatewayIdentify = {
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
   callStates: GatewayCallState[];
   voiceStates: GatewayVoiceState[];
};

export type GatewayResume = {
   op: GatewayOperations.RESUME;
   d: GatewayResumeData;
};

export type GatewayResumeData = {
   token: string;
   sessionId: string;
   seq: number;
};

export type GatewayUpdateVoiceStateData = {
   guildId: Snowflake | null;
   channelId: Snowflake | null;
} & GatewayVoiceStateFlags;

export type GatewayUpdateVoiceState = {
   op: GatewayOperations.VOICE_STATE_UPDATE;
   d: GatewayUpdateVoiceStateData;
};

export type GatewayMessageCreateData = APIMessage & GatewayMessageEventExtraFields;
export type GatewayMessageUpdateData = APIMessage & GatewayMessageEventExtraFields;
export type GatewayMessageDeleteData = {
   id: Snowflake;
   channelId: Snowflake;
   guildId?: Snowflake;
};

type GatewayMessageEventExtraFields = {
   guildId?: Snowflake;
   // TODO: Implement Guild Member
   // member?:
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

export type GatewayVoiceState = {
   userId: Snowflake;
   guildId: Snowflake | null;
   channelId: Snowflake | null;
   sessionId: Snowflake;
} & GatewayVoiceStateFlags;

export type GatewayVoiceStateFlags = {
   isAudioMuted: boolean;
   isAudioDeafened: boolean;
   isScreenSharing: boolean;
   isAudioStreaming: boolean;
   isCameraOn: boolean;
};

export type GatewayVoiceStateUpdateData = GatewayVoiceState;
export type GatewayCallState = {
   ringing: Snowflake[];
   messageId: Snowflake;
   channelId: Snowflake;
};

export type GatewayVoiceServerUpdateData = {
   token: string;
};

export type GatewayCallCreateData = GatewayCallState;
export type GatewayCallUpdateData = GatewayCallState;

export type GatewayCallDeleteData = {
   channelId: Snowflake;
};

export type GatewayUpdatePresence = {
   op: GatewayOperations.PRESENCE_UPDATE;
   d: GatewayUpdatePresenceData;
};

export type GatewayUpdatePresenceData = {
   status: PresenceStatus;
   activities: Activity[];
};

export type GatewaySettingsUpdateData = Partial<UserSettings>;

export type GatewaySessionUpdateData = {
   status: PresenceStatus;
   activities: Activity[];
   activeSessions: Snowflake[];
};
