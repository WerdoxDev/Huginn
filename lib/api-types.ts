import { Snowflake } from "./types";

//#region USER
type APIBaseUser = {
   id: Snowflake;
};

export type APIUser = {
   username: string;
   displayName: string;
   avatar: string;
   system?: boolean;
   email?: string;
   password?: string;
   // TODO: Actually implement flags
   flags: number;
} & APIBaseUser;

export type APIChannelUser = {
   username: string;
   avatar: string;
} & APIBaseUser;

export type APIMessageUser = {
   username: string;
   displayName: string;
   avatar: string;
   flags: unknown;
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
   displayName: string;
   email: string;
   password: string;
};

export type APIPostLoginResult = APIUser & Tokens;
export type APIPostRegisterResult = APIUser & Tokens;

export type APIPatchCurrentUserJSONBody = {
   email?: string;
   displayName?: string;
   username?: string;
   avatar?: string;
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

export type APIPostCreateDMJsonBody = {
   recipientId?: Snowflake;
   users?: Record<Snowflake, string>;
};

export type APIPostCreateDMResult = APIDMChannel | APIGroupDMChannel;

export type APIGetUserChannelsResult = Array<APIDMChannel | APIGroupDMChannel>;
//#endregion

//#region MESSAGE
type APIBaseMessage = {
   id: Snowflake;
   type: MessageType;
   channelId: Snowflake;
   author: APIMessageUser;
   content: string;
   createdAt: Date;
   editedAt: Date | null;
   mentions: APIMessageUser[];
};

export type APIMessage = APIDefaultMessage;

export type APIDefaultMessage = {
   type: MessageType.DEFAULT;
   attachments: string[];
   pinned: boolean;
   flags?: number | null;
   nonce?: number | string;
   reactions?: string[];
} & APIBaseMessage;

export type APIPostCreateDefaultMessageJSONBody = {
   content?: string;
   attachments?: string[];
   flags?: number;
   nonce?: number | string;
};

export type APIPostCreateDefaultMessageResult = APIDefaultMessage;

export type APIGetMessageByIdResult = APIMessage;

export type APIGetChannelMessagesResult = APIMessage[];

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
