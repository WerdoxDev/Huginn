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
   type APIReaction,
   ChannelType,
   CONSTANTS,
   decodeEmojiKey,
   type DirectChannel,
   type GatewayWebsocketEvents,
   MessageReferenceType,
   MessageType,
   nullToUndefined,
   omit,
   pick,
   recordSpanError,
   type Snowflake,
} from "@huginnjs/shared";

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

   dispatchToTopic(options.channelId, "message_create", await filterMessage(message));

   await sendAddMessagePushNotification(options.channelId, message);

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

   dispatchToTopic(options.channelId, "message_create", await filterMessage(message));

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

export async function filterMessage<T extends MessagePayload<{ select: typeof selectAllMessage }>>(
   message: T,
   options?: { receiverId?: Snowflake },
): Promise<APIMessage> {
   const signedAttachments = message.attachments.map(signAttachment);

   const reactions: APIReaction[] = [];
   if (message.reactionAggregates && message.reactionAggregates.length > 0 && options?.receiverId) {
      const meMap = Object.assign(
         {},
         ...(await Promise.all(
            message.reactionAggregates.map(async (reaction) => ({
               [reaction.emojiKey]: await prisma.reaction.hasUserReacted({
                  channelId: message.channelId,
                  messageId: message.id,
                  userId: options.receiverId!,
                  emojiKey: reaction.emojiKey,
               }),
            })),
         )),
      );

      for (const reaction of message.reactionAggregates) {
         const emoji = decodeEmojiKey(reaction.emojiKey);
         if (!emoji) {
            logger.warn({ emojiKey: reaction.emojiKey }, "failed to decode emoji key");
            continue;
         }

         reactions.push({
            emoji,
            me: meMap[reaction.emojiKey] ?? false,
            count: reaction.count,
         });
      }
   }

   return {
      ...omit(message, ["call", "messageReference", "reactionAggregates"]),
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
      ...(reactions.length > 0 && { reactions }),
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

export async function sendAddMessagePushNotification(channelId: Snowflake, message: MessagePayload<{ select: typeof selectAllMessage }>) {
   if (process.env.TEST) return;

   analytics.startActiveSpan("sendMessagePushNotification", async (span) => {
      try {
         span.setAttributes({
            "params.channel.id": channelId,
            "params.message.id": message.id,
            "message.author.id": message.author.id,
            "message.content_length": message.content.length,
         });

         const channel = await prisma.channel.getById(channelId, { select: { name: true, type: true, icon: true, id: true } });
         const recipients = await prisma.channel.getRecipients(channelId);
         const authorName = message.author.displayName ?? message.author.username;

         span.setAttributes({
            "channel.type": channel.type,
            "recipients.count": recipients.length,
         });

         const channelName =
            channel.type === ChannelType.GROUP_DM ? (channel.name ?? recipients.map((r) => r.displayName ?? r.username).join(", ")) : authorName;

         const username = message.author.displayName ?? message.author.username;
         const timestamp = message.timestamp.getTime();
         const authorIconUrl = message.author.avatar ? `/avatars/${message.author.id}/${message.author.avatar}.webp` : undefined;
         const channelIconUrl = channel.icon ? `/channel-icons/${channel.id}/${channel.icon}.webp` : undefined;

         span.setAttributes({
            "notification.body": message.content,
            "notification.author_icon_url": authorIconUrl ?? "null",
            "notification.channel_icon_url": channelIconUrl ?? "null",
            "notification.channel_name": channelName,
         });

         logger.debug(`sending push notification for message in channel ${channelId} for ${recipients.map((r) => r.id).join(", ")}`);

         await Promise.allSettled(
            recipients
               .filter((x) => x.id !== message.author.id)
               .map((user) =>
                  sendPushNotification(user.id, "add_message", {
                     data: {
                        content: message.content,
                        channelId,
                        messageId: message.id,
                        authorId: message.author.id,
                        timestamp,
                        username,
                        authorIconUrl,
                        channelIconUrl,
                        channelName,
                        channelType: channel.type,
                     },
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

export function sendAckedMessagePushNotification(userId: Snowflake, channelId: Snowflake, messageId: Snowflake) {
   if (process.env.TEST) return;

   analytics.startActiveSpan("senAckMessagePushNotification", async (span) => {
      try {
         span.setAttributes({
            "params.channel.id": channelId,
            "params.message.id": messageId,
         });

         sendPushNotification(userId, "ack_message", {
            data: {
               channelId,
               messageId,
            },
            notificationChannelId: "messages",
         });
      } catch (e) {
         recordSpanError(e);
      } finally {
         span.end();
      }
   });
}
