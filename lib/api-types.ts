import { Snowflake } from "./types";

//#region USER
export type APIUser = {
   _id: Snowflake;
   username: string;
   displayName: string;
   avatar: string;
   system?: boolean;
   email?: string;
   password?: string;
   // TODO: Actually implement flags
   flags: unknown;
};

export type APIChannelUser = {
   _id: Snowflake;
   username: string;
   avatar: string;
};

export type IncludesToken = {
   token: string;
   refreshToken: string;
};

export type APIGetUserResult = APIUser;
export type APIGetCurrentUserResult = APIUser;
export type APIGetUserByIdResult = APIUser;

export type APIPostRefreshTokenJSONBody = {
   refreshToken: string;
};

export type APIPostRefreshTokenResult = IncludesToken;

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

export type APIPostLoginResult = APIUser & IncludesToken;
export type APIPostRegisterResult = APIUser & IncludesToken;

export type APIPatchCurrentUserJSONBody = {
   email?: string;
   displayName?: string;
   username?: string;
   avatar?: string;
   password?: string;
   newPassword?: string;
};

export type APIPatchCurrentUserResult = APIUser & IncludesToken;

export type APIPostUniqueUsernameJSONBody = {
   username: string;
};

export type APIPostUniqueUsernameResult = {
   taken: boolean;
};
//#endregion

//#region CHANNEL
export type APIChannel = APIDMChannel | APIGroupDMChannel;

export type APIDMChannel = {
   _id: Snowflake;
   type: ChannelType.DM;
   lastMessageId?: Snowflake | undefined;
   recipients: APIUser[];
};

export type APIGroupDMChannel = {
   _id: Snowflake;
   type: ChannelType.GROUP_DM;
   name: string;
   icon: string | undefined;
   ownerId: Snowflake;
   lastMessageId?: Snowflake | undefined;
   recipients: APIUser[];
};

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
//#endregion
