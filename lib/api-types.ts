import { Snowflake } from "./types";

export interface APIUser {
   _id: Snowflake;
   username: string;
   displayName: string;
   avatar: string;
   system?: boolean;
   email?: string;
   password?: string;
   // TODO: Actually implement flags
   flags: unknown;
}

export interface IncludesToken {
   token: string;
   refreshToken: string;
}

export type APIGetUserResult = APIUser;
export type APIGetCurrentUserResult = APIUser;

export interface APIPostLoginJSONBody {
   email?: string;
   username?: string;
   password: string;
}

export interface APIPostRegisterJSONBody {
   username: string;
   displayName: string;
   email: string;
   password: string;
}

export type APIPostLoginResult = APIUser & IncludesToken;
export type APIPostRegisterResult = APIUser & IncludesToken;

export interface APIPatchCurrentUserJSONBody {
   email?: string;
   username?: string;
   avatar?: string;
}

export type APIPatchCurrentUserResult = APIUser & IncludesToken;

export interface APIPostUniqueUsernameJSONBody {
   username: string;
}

export interface APIPostUniqueUsernameResult {
   taken: boolean;
}
