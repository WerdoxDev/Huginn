import { Snowflake } from "./snowflake";

export type LoginCredentials = APIPostLoginJSONBody;
export type RegisterUser = APIPostRegisterJSONBody;
export type DirectChannel = APIDMChannel | APIGroupDMChannel;

export type TokenPayload = {
   id: Snowflake;
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
   email?: string;
   password?: string;
   // TODO: Actually implement flags
   flags: UserFlags;
} & APIBaseUser;

export type APIChannelUser = {
   username: string;
   displayName: string | null;
   avatar: string | null;
   flags: UserFlags;
} & APIBaseUser;

export type APIMessageUser = {
   username: string;
   displayName: string | null;
   avatar: string | null;
   flags: UserFlags;
} & APIBaseUser;

export type APIRelationUser = {
   username: string;
   displayName: string | null;
   avatar: string | null;
   flags: UserFlags;
} & APIBaseUser;

export type Tokens = {
   token: string;
   refreshToken: string;
};

export type APIGetUserResult = APIUser;
export type APIGetCurrentUserResult = APIUser;
export type APIGetUserByIdResult = APIUser;

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

export type APIPostLoginResult = APIUser & Tokens;
export type APIPostRegisterResult = APIUser & Tokens;

export type APIPatchCurrentUserJSONBody = {
   email?: string;
   displayName?: string | null;
   username?: string;
   avatar?: string | null;
   password?: string;
   newPassword?: string;
};

export type APIPatchCurrentUserResult = APIUser & Tokens;

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
   NONE,
   FRIEND,
   BLOCKED,
   PENDING_INCOMING,
   PENDING_OUTGOING,
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
   DM,
   GROUP_DM,
   GUILD_TEXT,
   GUILD_VOICE,
   GUILD_CATEGORY,
}

export type APIGetChannelByIdResult = APIChannel;

export type APIPostDMChannelJSONBody = {
   recipients: Snowflake[];
};

export type APIPostDMChannelResult = APIDMChannel | APIGroupDMChannel;

export type APIDeleteDMChannelResult = APIDMChannel | APIGroupDMChannel;

export type APIGetUserChannelsResult = (APIDMChannel | APIGroupDMChannel)[];
//#endregion

//#region MESSAGE
type APIBaseMessage = {
   id: Snowflake;
   type: MessageType;
   channelId: Snowflake;
   author: APIMessageUser;
   content: string;
   createdAt: Date | string;
   editedAt: Date | string | null;
   mentions: APIMessageUser[];
};

export type APIMessage = APIDefaultMessage;

export enum MessageFlags {
   NONE = 0,
   SUPPRESS_NOTIFICATIONS = 1 << 0,
   SUPPRESS_EMBEDS = 1 << 1,
   URGENT = 1 << 2,
   EPHEMERAL = 1 << 3,
   LOADING = 1 << 4,
}

export type APIDefaultMessage = {
   type: MessageType.DEFAULT;
   attachments: string[];
   pinned: boolean;
   flags?: MessageFlags | null;
   nonce?: number | string;
   reactions?: string[];
} & APIBaseMessage;

export type APIPostDefaultMessageJSONBody = {
   content?: string;
   attachments?: string[];
   flags?: MessageFlags;
   nonce?: number | string;
};

export type APIPostDefaultMessageResult = APIDefaultMessage;

export type APIGetMessageByIdResult = APIMessage;

export type APIGetChannelMessagesResult = APIMessage[];

export type APIGetReleasesResult = Record<string, { version: string; date: string; windowsSetupUrl?: string } | undefined>;

export enum MessageType {
   DEFAULT,
   RECIPIENT_ADD,
   RECIPIENT_REMOVE,
   CALL,
   CHANNEL_NAME_CHANGED,
   CHANNEL_ICON_CHANGED,
   CHANNEL_PINNED_MESSAGE,
   USER_JOIN,
   REPLY,
}
//#endregion
