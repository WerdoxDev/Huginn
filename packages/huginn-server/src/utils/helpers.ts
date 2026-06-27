import { prisma } from "@huginn/backend-shared/database";
import {
   selectChannelDefaults,
   selectKnownApplication,
   selectAllMessage,
   type ChannelPayload,
   type KnownApplicationPayload,
   type MessagePayload,
} from "@huginn/backend-shared/database/common";
import { logger } from "@huginn/backend-shared/logger";
import {
   analytics,
   type APIMessage,
   type APIMessageCall,
   type APIMessageReference,
   changeUrlBase,
   ChannelType,
   CONSTANTS,
   type DirectChannel,
   type GatewayWebsocketEvents,
   MessageReferenceType,
   MessageType,
   nullToUndefined,
   omit,
   pick,
   recordSpanError,
   type Snowflake,
} from "@huginn/shared";

import { env } from "#setup";

import { dispatchToTopic } from "./gateway-utils";
import { sendPushNotification } from "./route-utils";

export async function dispatchMessage(options: {
   authorId: Snowflake;
   channelId: Snowflake;
   type: MessageType;
   content?: string;
   mentions?: Snowflake[];
   messageReferenceId?: string;
   flags?: number;
}) {
   const message = await prisma.message.createOne(
      {
         authorId: options.authorId,
         channelId: options.channelId,
         type: options.type,
         content: options.content,
         mentions: options.mentions,
         messageReference: options.messageReferenceId
            ? { channelId: options.channelId, messageId: options.messageReferenceId, type: MessageReferenceType.DEFAULT }
            : undefined,
         flags: options.flags,
      },
      { select: selectAllMessage },
   );

   dispatchToTopic(options.channelId, "message_create", filterMessage(message));

   await sendMessagePushNotification(options.channelId, message);
   // await sendPushNotification()

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
      { select: selectAllMessage },
   );

   dispatchToTopic(options.channelId, "message_create", filterMessage(message) as APIMessage);

   return message;
}

export function channelWithoutRecipient(channel: DirectChannel, recipientId: Snowflake) {
   return { ...channel, recipients: channel.recipients.filter((x) => x.id !== recipientId) };
}

export function dispatchChannel(
   channel: DirectChannel,
   topic: keyof Pick<GatewayWebsocketEvents, "channel_create" | "channel_update" | "channel_delete">,
   userId: Snowflake,
) {
   dispatchToTopic(userId, topic, channelWithoutRecipient(channel, userId));
}

export function filterMessage<T extends MessagePayload<{ select: typeof selectAllMessage }>>(message: T): APIMessage {
   const signedAttachments = message.attachments.map(signAttachment);
   return {
      ...omit(message, ["call", "messageReference"]),
      ...(message.call !== null && {
         call: {
            endedTimestamp: message.call.endedTimestamp,
            participants: message.call.participants.map((x) => x.id),
         } as APIMessageCall,
      }),
      ...(message.messageReference !== null && {
         messageReference: omit(message.messageReference, ["message"]) as APIMessageReference,
      }),
      ...(message.messageReference?.message !== undefined && {
         referencedMessage: !message.messageReference.message ? null : message.messageReference?.message,
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
      ...(knownApplication.contributorId !== null && {
         contributorId: knownApplication.contributorId,
      }),
      ...(knownApplication.igdbId !== null && { igdbId: knownApplication.igdbId }),
   };
}

export function signAttachment<A extends { url: string }>(attachment: A): A {
   const ttlSeconds = CONSTANTS.CDN_HMAC_EXPIRE_TIME;
   const expiry = Math.floor(Date.now() / 1000) + ttlSeconds;

   const hasher = new Bun.CryptoHasher("sha256", env.CDN_HMAC_SECRET);
   hasher.update(`${attachment.url}:${expiry}`);
   const signature = hasher.digest("hex");

   return { ...attachment, url: `${attachment.url}?ex=${expiry}&hm=${signature}` };
}

export async function sendMessagePushNotification(channelId: Snowflake, message: MessagePayload<{ select: typeof selectAllMessage }>) {
   analytics.startActiveSpan("sendMessagePushNotification", async (span) => {
      try {
         span.setAttributes({
            "params.channel_id": channelId,
            "params.message_id": message.id,
            "message.author.id": message.author.id,
            "message.content_length": message.content.length,
         });

         const channel = await prisma.channel.getById(channelId, { select: { name: true, type: true } });
         const recipients = (await prisma.channel.getRecipients(channelId)).filter((r) => r.id !== message.author.id);

         span.setAttributes({
            "channel.type": channel.type,
            "recipients.count": recipients.length,
         });

         const channelName = channel.name ?? recipients.map((r) => r.displayName ?? r.username).join(", ");

         const username = message.author.displayName ?? message.author.username;
         const title = username + (channel?.type === ChannelType.GROUP_DM ? ` - (${channelName})` : "");
         const firstAttachment = message.attachments[0] ? signAttachment(message.attachments[0]) : undefined;
         const imageUrl = env.CDN_PUBLIC_URL && firstAttachment ? changeUrlBase(firstAttachment.url, env.CDN_PUBLIC_URL) : undefined;

         span.setAttributes({
            "notification.title": title,
            "notification.body": message.content,
            "notification.image_url": imageUrl ?? "none",
         });

         logger.debug(`sending push notification for message in channel ${channelId} for ${recipients.map((r) => r.id).join(", ")}`);

         await Promise.allSettled(
            recipients.map((user) =>
               sendPushNotification(user.id, {
                  title: title,
                  body: message.content,
                  imageUrl: imageUrl,
                  data: { channelId, messageId: message.id },
                  notificationChannelId: "messages",
               }),
            ),
         );
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}
