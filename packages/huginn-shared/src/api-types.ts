import type { Snowflake } from "./snowflake";

export type LoginCredentials = APIPostLoginJSONBody;
export type RegisterUser = APIPostRegisterJSONBody;

export type DirectChannel = APIDMChannel | APIGroupDMChannel;
export type AuthType = "password" | OAuthType;

export type UserTokenPayload = {
   id: Snowflake;
   authType: AuthType;
   lastAuthenticatedAt: number;
};

export type UserRefreshTokenPayload = {
   id: Snowflake;
   authType: AuthType;
   lastAuthenticatedAt: number;
};

export type OAuthTokenPayload = {
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

export const UserFlags = {
   NONE: 0,
   STAFF: (1 << 0) as number,
   BUG_HUNTER: (1 << 1) as number,
   EARLY_HUGINN_SUPPORTER: (1 << 2) as number,
} as const;

export type UserFlags = (typeof UserFlags)[keyof typeof UserFlags];

export type APIUser = {
   username: string;
   displayName: string | null;
   avatar: string | null;
   banner: string | null;
   bannerColor?: string | null;
   accentColor?: string | null;
   bio: string | null;
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
   banner: string | null;
   bannerColor?: string | null;
   accentColor?: string | null;
   bio: string | null;
   flags: UserFlags;
} & APIBaseUser;

export type APIChannelUser = APIPublicUser;
export type APIMessageUser = APIPublicUser;
export type APIRelationUser = APIPublicUser;

export type Tokens = {
   token: string;
   refreshToken: string;
};

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

export type EmailVerificationPurpose = "registration" | "email_change";

export type APIPatchCurrentUserJSONBody = {
   email?: string;
   displayName?: string | null;
   username?: string;
   avatar?: string | null;
   banner?: string | null;
   bannerColor?: string | null;
   accentColor?: string | null;
   bio?: string | null;
   password?: string;
   newPassword?: string;
};

export type APIPostOAuthConfirmJSONBody = {
   username: string;
   displayName: string | null;
   avatar: string | null;
};

export type APIPostLoginResult = (APIUser & Tokens) | { pendingEmail: string };
export type APIPostRegisterResult = APIUser & Partial<Tokens> & { pendingEmail?: string };
export type APIPatchCurrentUserResult = APIUser & Tokens & { pendingEmail?: string };
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

export const RelationshipType = {
   NONE: 0,
   FRIEND: 1,
   BLOCKED: 2,
   PENDING_INCOMING: 3,
   PENDING_OUTGOING: 4,
} as const;

export type RelationshipType = (typeof RelationshipType)[keyof typeof RelationshipType];

export type APIGetUserRelationshipsResult = APIRelationshipWithoutOwner[];
export type APIGetUserRelationshipByIdResult = APIRelationshipWithoutOwner;

export type APIPostRelationshipJSONBody = {
   username: string;
};
//#endregion

//#region CHANNEL
export const ChannelType = {
   DM: 0,
   GROUP_DM: 1,
   GUILD_TEXT: 2,
   GUILD_VOICE: 3,
   GUILD_CATEGORY: 4,
} as const;

export type ChannelType = (typeof ChannelType)[keyof typeof ChannelType];

type APIBaseChannel = {
   id: Snowflake;
   type: ChannelType;
};

export type APIDMChannel = {
   type: typeof ChannelType.DM;
   lastMessageId: Snowflake | null;
   recipients: APIChannelUser[];
} & APIBaseChannel;

export type APIGroupDMChannel = {
   type: typeof ChannelType.GROUP_DM;
   name: string;
   icon: string | null;
   ownerId: Snowflake;
   lastMessageId: Snowflake | null;
   recipients: APIChannelUser[];
} & APIBaseChannel;

export type APIGuildCategoryChannel = {
   type: typeof ChannelType.GUILD_CATEGORY;
   // guildId: Snowflake;
   // position: number;
   name: string;
} & APIBaseChannel;

export type APIPostDMChannelJSONBody = {
   name?: string;
   recipients: Snowflake[];
};

export type APIPatchDMChannelJSONBody = {
   name?: string | null;
   icon?: string | null;
   owner?: string;
};

export type APIGetChannelByIdResult = DirectChannel;
export type APIPostDMChannelResult = DirectChannel;
export type APIPatchDMChannelResult = DirectChannel;
export type APIDeleteDMChannelResult = DirectChannel;
export type APIGetUserChannelsResult = DirectChannel[];
//#endregion

//#region MESSAGE
export const MessageType = {
   DEFAULT: 0,
   RECIPIENT_ADD: 1,
   RECIPIENT_REMOVE: 2,
   CALL: 3,
   CHANNEL_NAME_CHANGED: 4,
   CHANNEL_ICON_CHANGED: 5,
   CHANNEL_PINNED_MESSAGE: 6,
   CHANNEL_OWNER_CHANGED: 7,
   USER_JOIN: 8,
   REPLY: 9,
} as const;

export type MessageType = (typeof MessageType)[keyof typeof MessageType];

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
   nonce?: string;
   reactions?: string[];
};

export type APIDefaultMessage = APIBaseMessage & {
   type:
      | typeof MessageType.DEFAULT
      | typeof MessageType.RECIPIENT_ADD
      | typeof MessageType.RECIPIENT_REMOVE
      | typeof MessageType.CHANNEL_ICON_CHANGED
      | typeof MessageType.CHANNEL_NAME_CHANGED
      | typeof MessageType.CHANNEL_OWNER_CHANGED;
};

export type APICallMessage = APIBaseMessage & {
   type: typeof MessageType.CALL;
   call: APIMessageCall;
};

export type APIReferenceMessage = APIBaseMessage & {
   type: typeof MessageType.REPLY | typeof MessageType.CHANNEL_PINNED_MESSAGE;
   messageReference: APIMessageReference;
   referencedMessage?: APIMessage | null;
};

export type APIMessage = APICallMessage | APIDefaultMessage | APIReferenceMessage;

export const MessageFlags = {
   NONE: 0,
   SUPPRESS_NOTIFICATIONS: (1 << 0) as number,
   SUPPRESS_EMBEDS: (1 << 1) as number,
   URGENT: (1 << 2) as number,
   EPHEMERAL: (1 << 3) as number,
   LOADING: (1 << 4) as number,
} as const;

export type MessageFlags = (typeof MessageFlags)[keyof typeof MessageFlags];

export type APIMessageCall = { participants: Snowflake[]; endedTimestamp: Date | string | null };

export type APIPostMessageJSONBody = {
   content?: string;
   attachments?: APIPostAttachmentJSONBody[];
   embeds?: APIEmbed[];
   flags?: MessageFlags;
   nonce?: number | string;
   messageReference?: APIPostMessageReferenceJSONBody;
};

export const MessageReferenceType = {
   DEFAULT: 0,
} as const;

export type MessageReferenceType = (typeof MessageReferenceType)[keyof typeof MessageReferenceType];

export type APIPostMessageReferenceJSONBody = APIMessageReference;

export type APIMessageReference = {
   type: MessageReferenceType;
   messageId: Snowflake;
   channelId: Snowflake;
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
   width: number;
   height: number;
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

export type APIPostMessageResult = APIMessage;
export type APIPatchMessageResult = APIDefaultMessage;

export type APIPatchMessageJSONBody = {
   content?: string;
   embeds?: APIEmbed;
   attachments?: APIPostAttachmentJSONBody[];
};

export type APIGetMessageByIdResult = APIMessage;
export type APIGetChannelMessagesResult = APIMessage[];
export type APIMessagePin = {
   pinnedAt: Date | string;
   message: APIMessage;
};

export type APIGetChannelPinsResult = APIMessagePin[];
export type APIPutChannelPinResult = APIMessagePin;
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
//#endregion

export type PresenceStatus = "offline" | "online" | "dnd" | "idle";
export type UserPresence = {
   user: PresenceUser;
   status: PresenceStatus;
   activities: Activity[];
   activeSessions: ActiveSession[];
};

export type PresenceUser<U extends APIBaseUser = APIPublicUser> = Partial<U> & { id: Snowflake };

export type UserSettings = {
   theme?: "cerulean" | "pine-green" | "eggplant" | "coffee" | "charcoal" | "scarlet";
   status: PresenceStatus;
   pinnedChannels?: Snowflake[];
};

export type ActiveSession = {
   sessionId: Snowflake;
};

export const ActivityType = {
   PLAYING: 0,
   LISTENING: 1,
} as const;

export type ActivityType = (typeof ActivityType)[keyof typeof ActivityType];

export type Activity = {
   name: string;
   type: ActivityType;
   createdAt: number;
   startedAt?: number;
   applicationId?: number;
   iconUrl?: string;
   sessionId: Snowflake;
};

export type ActivityWithoutSessionId = Omit<Activity, "sessionId">;

export type OAuthType = "google" | "github";
export type OAuthFlow = "browser" | "desktop";
export type OAuthResult = {
   flow: OAuthFlow;
   access_token?: string;
   refresh_token?: string;
   oauth_token?: string;
};

export type APIReadState = {
   userId: Snowflake;
   channelId: Snowflake;
   lastReadMessageId: Snowflake | null;
   unreadCount: number;
};

export type APIReadStateWithoutUser = Omit<APIReadState, "userId">;

export type APIPatchUserSettingsJSONBody = Partial<UserSettings>;
export type APIPatchUserSettingsResult = UserSettings;

export type APIKnownApplication = {
   id: number;
   names: string[];
   exeName: string;
   commandLinePatterns: string[];
   updatedAt: Date | string | null;
   createdAt: Date | string;
   deletedAt?: Date | string | null;
   contributorId?: Snowflake;
   igdbId?: number;
};

export type APIGetKnownApplicationsResult = {
   lastUpdated: string;
   applications: APIKnownApplication[];
};

export type APIPostApplicationIconJSONBody = {
   icon: string;
   applicationId?: number;
};

export type APIPostKnownApplicationJSONBody = {
   windowTitle: string;
   exePath: string;
};

export type APIPostApplicationIconResult = string;

export type APIPostKnownApplicationResult = APIKnownApplication;

// export type APIEmailVerification =

export type APIPostVerifyEmailJSONBody = {
   code: string;
   email: string;
};
export type APIPostVerifyEmailResult = APIUser & Partial<Tokens>;

export type BadgeType = "staff" | "bug_hunter" | "early_supporter";
export type APIBadge = {
   id: BadgeType;
   color: string;
   description: string;
   icon: string;
};

export type APIUserProfile = {
   user: APIPublicUser;
   badges: APIBadge[];
};

export type APIGetProfileResult = APIUserProfile;

export type APIGetChangelogResult = Array<{ title: string; version: string; content: string; date: string; platform: string }>;

export type APIPostNotificationTokenJSONBody = {
   token: string;
   deviceId: string;
};
