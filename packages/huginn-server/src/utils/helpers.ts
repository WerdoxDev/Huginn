import { prisma } from "@huginn/backend-shared/database";
import {
   selectChannelDefaults,
   selectKnownApplication,
   selectMessageDefaults,
   type ChannelPayload,
   type KnownApplicationPayload,
   type MessagePayload,
} from "@huginn/backend-shared/database/common";
import {
   ChannelType,
   constants,
   type DirectChannel,
   type GatewayEvents,
   MessageType,
   nullToUndefined,
   omit,
   pick,
   type Snowflake,
} from "@huginn/shared";
import { dispatchToTopic } from "./gateway-utils";
import { envs } from "#setup";

export async function dispatchMessage(options: {
   authorId: Snowflake;
   channelId: Snowflake;
   type: MessageType;
   content?: string;
   mentions?: Snowflake[];
   flags?: number;
}) {
   const message = await prisma.message.createOne(
      {
         authorId: options.authorId,
         channelId: options.channelId,
         type: options.type,
         content: options.content,
         mentions: options.mentions,
         flags: options.flags,
      },
      { select: selectMessageDefaults },
   );

   dispatchToTopic(options.channelId, "message_create", filterMessage(message));

   return message;
}

export async function dispatchCallMessage(options: { authorId: Snowflake; channelId: Snowflake }) {
   const message = await prisma.message.createOne(
      {
         authorId: options.authorId,
         channelId: options.channelId,
         type: MessageType.CALL,
         call: { participants: [options.authorId] },
      },
      { select: selectMessageDefaults },
   );

   dispatchToTopic(options.channelId, "message_create", filterMessage(message));

   return message;
}

export function channelWithoutRecipient(channel: DirectChannel, recipientId: Snowflake) {
   return { ...channel, recipients: channel.recipients.filter((x) => x.id !== recipientId) };
}

export function dispatchChannel(
   channel: DirectChannel,
   topic: keyof Pick<GatewayEvents, "channel_create" | "channel_update" | "channel_delete">,
   userId: Snowflake,
) {
   dispatchToTopic(userId, topic, channelWithoutRecipient(channel, userId));
}

export function filterMessage<T extends MessagePayload<{ select: typeof selectMessageDefaults }>>(message: T) {
   const ttlSeconds = constants.CDN_HMAC_EXPIRE_TIME;
   const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;

   const signedAttachments = message.attachments.map((x) => {
      const hasher = new Bun.CryptoHasher("sha256", envs.CDN_HMAC_SECRET);
      hasher.update(`${x.url}:${expiry}`);
      const signature = hasher.digest("hex");

      return { ...x, url: `${x.url}?ex=${expiry}&hm=${signature}` };
   });

   return {
      ...omit(message, ["call"]),
      ...(message.call !== null && {
         call: { endedTimestamp: message.call.endedTimestamp, participants: message.call.participants.map((x) => x.id) },
      }),
      embeds: nullToUndefined(message.embeds),
      attachments: nullToUndefined(signedAttachments),
   };
}

export function filterChannel<T extends ChannelPayload<{ select: typeof selectChannelDefaults }>>(channel: T) {
   if (channel.type === ChannelType.DM) {
      return pick(channel, ["id", "lastMessageId", "recipients", "type"]);
   }

   if (channel.type === ChannelType.GROUP_DM) {
      return pick(channel, ["id", "icon", "name", "lastMessageId", "recipients", "type", "ownerId"]);
   }

   return channel;
}

export function filterKnownApplication<T extends KnownApplicationPayload<{ select: typeof selectKnownApplication }>>(knownApplication: T) {
   return {
      ...omit(knownApplication, ["igdbId", "contributorId"]),
      ...(knownApplication.contributorId !== null && { contributorId: knownApplication.contributorId }),
      ...(knownApplication.igdbId !== null && { igdbId: knownApplication.igdbId }),
   };
}
