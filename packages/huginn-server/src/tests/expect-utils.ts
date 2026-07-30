import {
   type ActiveSession,
   type Activity,
   type APIEmbed,
   type APIThumbnail,
   type APIVideo,
   ChannelType,
   type GatewaySessionUpdateData,
   type GatewayVoiceStateFlags,
   MessageType,
   type PresenceStatus,
   RelationshipType,
   type Snowflake,
   type UserSettings,
} from "@huginnjs/shared";
import { expect } from "bun:test";

import { containsId } from "./utils";

type ExpectUserOptions = {
   id: bigint;
   username: string;
   displayName: string | null;
   avatar: string | null;
   flags: number;
   banner: string | null;
   bannerColor?: string | null;
   accentColor?: string | null;
   bio: string | null;
   email?: string;
   pendingEmail?: string | null;
   hasTokens?: boolean;
};

export function expectUserExactSchema(user: any, options: ExpectUserOptions) {
   const keys = ["id", "username", "displayName", "avatar", "flags", "banner", "bannerColor", "accentColor", "bio"];

   if (options.email) {
      expect(user).toHaveProperty("email", options.email);
      keys.push("email");
   }
   if (options.pendingEmail) {
      expect(user).toHaveProperty("pendingEmail", options.pendingEmail);
      keys.push("pendingEmail");
   }
   if (options.hasTokens) {
      expect(user).toHaveProperty("token");
      expect(user).toHaveProperty("refreshToken");
      keys.push("token", "refreshToken");
   }

   expect(user).toContainAllKeys(keys);

   expect({ ...user }).toMatchObject({
      id: options.id.toString(),
      username: options.username,
      displayName: options.displayName,
      avatar: options.avatar,
      flags: options.flags,
      banner: options.banner,
      bannerColor: options.bannerColor,
      accentColor: options.accentColor,
      bio: options.bio,
   });
}

export function expectChannelExactSchema(
   channel: any,
   options: {
      type: ChannelType;
      id?: bigint;
      potentialOwnerIds?: bigint[];
      name?: string;
      icon?: string;
      withoutRecipients?: boolean;
      lastMessageId?: bigint;
   },
) {
   expect(channel).toHaveProperty("type", options.type);
   expect(channel).toHaveProperty("lastMessageId");

   expect({ ...channel }).toMatchObject({
      id: options.id?.toString() ?? expect.any(String),
      type: options.type,
   });

   let handled = false;

   if (options.type === ChannelType.DM) {
      handled = true;
   }

   if (options.type === ChannelType.GROUP_DM) {
      expect({ ...channel }).toMatchObject({
         name: options.name ?? null,
         icon: options.icon ?? null,
         ownerId: expect.any(String),
      });
      expect(channel).toHaveProperty("ownerId");

      if (options.potentialOwnerIds) expect(options.potentialOwnerIds).toContain(BigInt(channel.ownerId));
      handled = true;
   }

   if (!options.withoutRecipients) {
      expect(channel).toHaveProperty("recipients");
      for (const recipient of channel.recipients) {
         expect(recipient).toContainKeys(["username", "displayName", "flags", "avatar", "id", "banner", "bannerColor", "accentColor", "bio"]);
      }
   }

   expect(handled, `Channel with the type of ${options.type} was not handled`).toBeTrue();
}

export function expectChannelExactRecipients(channel: any, recipients: ExpectUserOptions[]) {
   expect(channel).toHaveProperty("recipients");
   expect(channel.recipients.length).toBe(recipients.length);

   // check for recipients that are in the array but not in the channel.recipients
   expect(
      channel.recipients.every((x: any) => recipients.some((y) => y.id.toString() === x.id)),
      "The returned channel recipients does not match the expected recipients",
   ).toBeTrue();

   for (const user of recipients) {
      expect(containsId(channel.recipients, user.id.toString())).toBeTrue();

      const channelRecipient = channel.recipients.find((x: any) => x.id === user.id.toString());
      expectUserExactSchema(channelRecipient, { ...user, email: undefined });
   }
}

export function expectMessageExactSchema(
   message: any,
   options: {
      type: MessageType;
      id?: bigint;
      channelId?: bigint;
      author?: ExpectUserOptions;
      content?: string;
      mentions?: ExpectUserOptions[];
      reactions?: any[];
      messageReference?: any;
   },
) {
   expect({ ...message }).toMatchObject({
      id: options.id?.toString() ?? expect.any(String),
      type: options.type,
      channelId: options.channelId?.toString() ?? expect.any(String),
      content: options.content ?? expect.any(String),
   });

   const keys = [
      "id",
      "type",
      "author",
      "channelId",
      "content",
      "timestamp",
      "editedTimestamp",
      "embeds",
      "attachments",
      "pinned",
      "mentions",
      "flags",
      "mentionEveryone",
      "mentionOwner",
   ];

   if (options.type === MessageType.REPLY) keys.push("messageReference", "referencedMessage");
   if (options.type === MessageType.CALL) keys.push("call");

   expect(message).toContainAllKeys(keys);

   if (options.author) expectUserExactSchema(message.author, { ...options.author, email: undefined });

   if (options.mentions) {
      const messageMentions = message.mentions.toSorted();
      options.mentions.toSorted().forEach((x, i) => expectUserExactSchema(messageMentions[i], { ...x, email: undefined }));
   }

   if (options.reactions) {
      //TODO: DO THIS
   }

   if (options.messageReference) expect(message.messageReference).toStrictEqual(options.messageReference);
}

type ExpectRelationshipOptions = {
   type: RelationshipType;
   id?: bigint;
   user?: ExpectUserOptions;
   nickname?: string;
};

export function expectRelationshipExactSchema(relationship: any, options: ExpectRelationshipOptions) {
   expect({ ...relationship }).toMatchObject({
      id: options.id?.toString() ?? expect.any(String),
      type: options.type,
   });

   if (options.nickname) expect(relationship).toHaveProperty("nickname", options.nickname);
   if (options.user) expectUserExactSchema(relationship.user, { ...options.user, email: undefined });
}

type ExpectPresenceOptions = {
   user: ExpectUserOptions;
   status: PresenceStatus;
   activeSessionIds: Snowflake[];
   isPartialUser?: boolean;
   activities: Activity[];
};

export function expectPresenceExactSchema(presence: any, options: ExpectPresenceOptions) {
   const activeSessions: ActiveSession[] = options.activeSessionIds.map((x) => ({ sessionId: x }));

   if (options.status === "offline") {
      expect(presence).toStrictEqual({
         user: { id: options.user.id.toString() },
         status: "offline",
         activeSessions,
         activities: [],
      });
      return;
   }

   expect(presence).toMatchObject({
      status: options.status,
      activeSessions,
      activities: options.activities,
   });

   if (!options.isPartialUser) expectUserExactSchema(presence.user, { ...options.user, email: undefined });
   else expect(presence).toHaveProperty("user", { id: options.user.id.toString() });
}

type ExpectTypingOptions = {
   channelId?: bigint;
   userId?: bigint;
};

export function expectTypingExactSchema(typing: any, options: ExpectTypingOptions) {
   expect(typing).toContainAllKeys(["channelId", "userId", "timestamp"]);
   expect(typing).toHaveProperty("channelId", options.channelId?.toString());
   expect(typing).toHaveProperty("userId", options.userId?.toString());
}

type ExpectRecipientModifyOptions = {
   channelId?: bigint;
   user?: ExpectUserOptions;
};

export function expectRecipientModifyExactSchema(recipientModify: any, options: ExpectRecipientModifyOptions) {
   expect(recipientModify).toContainAllKeys(["channelId", "user"]);
   expect(recipientModify).toHaveProperty("channelId", options.channelId?.toString());
   if (options.user) expectUserExactSchema(recipientModify.user, { ...options.user, email: undefined });
}

type ExpectReadStatesOptions = {
   channelId: Snowflake;
   userIds: bigint[];
};

export function expectReadStatesExactSchema(readStates: any[], options: ExpectReadStatesOptions) {
   expect(readStates.length).toBe(options.userIds.length);

   expect(
      readStates.every((x) => options.userIds.some((y) => y === x.userId)),
      "The user ids of read states does not match the expected user ids",
   ).toBeTrue();

   for (const readState of readStates) {
      expect(readState).toContainAllKeys(["channelId", "userId", "lastReadMessageId"]);
   }
}

type ExpectAttachmentOptions = {
   filename: string;
   width: number;
   height: number;
   description?: string;
};

export function expectAttachmentExactSchema(attachment: any, options: ExpectAttachmentOptions) {
   expect(attachment).toContainAllKeys(["id", "flags", "size", "contentType", "url", "filename", "width", "height", "description"]);

   expect(attachment).toMatchObject({
      filename: options.filename,
      width: options.width,
      height: options.height,
      description: options.description,
   });

   expect(attachment.url).toInclude(options.filename);
}

type ExpectEmbedOptions = {
   type: APIEmbed["type"];
   title?: string;
   url?: string;
   description?: string;
   timestamp?: string;
   thumbnail?: APIThumbnail;
   video?: APIVideo;
};

export function expectEmbedExactSchema(embed: any, options: ExpectEmbedOptions) {
   expect(embed).toHaveProperty("type", options.type);
   if (options.title) expect(embed).toHaveProperty("title", options.title);
   if (options.url) expect(embed).toHaveProperty("url", options.url);
   if (options.description) expect(embed).toHaveProperty("description", options.description);
   if (options.timestamp) expect(embed).toHaveProperty("timestamp", options.timestamp);
   if (options.thumbnail) expect(embed).toHaveProperty("thumbnail", options.thumbnail);
   if (options.video) expect(embed).toHaveProperty("video", options.video);
}

type ExpectVoiceStateOptions = {
   channelId: Snowflake | null;
   guildId: Snowflake | null;
   userId: Snowflake;
   sessionId: Snowflake;
   flags?: Partial<GatewayVoiceStateFlags>;
};

export function expectVoiceStateExactSchema(voiceState: any, options: ExpectVoiceStateOptions) {
   expect(voiceState).toStrictEqual({
      channelId: options.channelId,
      guildId: options.guildId,
      userId: options.userId,
      sessionId: options.sessionId,
      isAudioDeafened: options.flags?.isAudioDeafened ?? voiceState.isAudioDeafened,
      isAudioMuted: options.flags?.isAudioMuted ?? voiceState.isAudioMuted,
      isScreenSharing: options.flags?.isScreenSharing ?? voiceState.isScreenSharing,
      isAudioStreaming: options.flags?.isAudioStreaming ?? voiceState.isAudioStreaming,
      isCameraOn: options.flags?.isCameraOn ?? voiceState.isCameraOn,
   });
}

type ExpectCallStateOptions = {
   channelId: Snowflake;
   messageId?: Snowflake;
   ringing?: Snowflake[];
};

export function expectCallStateExactSchema(callState: any, options: ExpectCallStateOptions) {
   expect(callState).toHaveProperty("channelId", options.channelId.toString());
   if (options.messageId) expect(callState).toHaveProperty("messageId", options.messageId.toString());
   if (options.ringing) {
      expect(callState).toHaveProperty("ringing");
      expect(callState.ringing).toEqual(options.ringing.map((x) => x.toString()));
   }
}

export function expectUserSettingsExactSchema(userSettings: any, expectedSettings: UserSettings) {
   expect(userSettings).toStrictEqual(expectedSettings);
}

export function expectSessionUpdateExactSchema(sessionUpdate: any, expectedSessionUpdate: GatewaySessionUpdateData) {
   expect(sessionUpdate).toStrictEqual(expectedSessionUpdate);
}

export function expectVoiceServerExactSchema(voiceServer: object) {
   expect(Object.keys(voiceServer).sort()).toStrictEqual(["token"].sort());
}

export function expectReactionExactSchema(emoji: any, options: { count: number; me: boolean; emoji: { id: string | null; name: string } }) {
   expect(emoji).toStrictEqual({
      count: options.count,
      me: options.me,
      emoji: options.emoji,
   });
}
