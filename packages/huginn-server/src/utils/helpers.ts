import { Prisma, prisma } from "@huginn/backend-shared/database";
import { selectMessageDefaults } from "@huginn/backend-shared/database/common";
import { type BigIntToString, type DirectChannel, type GatewayEvents, MessageType, nullToUndefined, omit, type Snowflake } from "@huginn/shared";
import { dispatchToTopic } from "./gateway-utils";

export async function dispatchMessage(options: {
   authorId: Snowflake;
   channelId: Snowflake;
   type: MessageType;
   content?: string;
   mentions?: Snowflake[];
   flags?: number;
}) {
   const message = await prisma.message.createMessage(
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
   const message = await prisma.message.createMessage(
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

export function filterMessage<T extends BigIntToString<Prisma.MessageGetPayload<{ select: typeof selectMessageDefaults }>>>(message: T) {
   return {
      ...omit(message, ["call"]),
      ...(message.call ? { call: { endedTimestamp: message.call.endedTimestamp, participants: message.call.participants.map((x) => x.id) } } : {}),
      embeds: nullToUndefined(message.embeds),
      attachments: nullToUndefined(message.attachments),
   };
}
