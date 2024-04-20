import { Snowflake } from "@shared/snowflake";
import { DBErrorType, assertObjectWithCause, prisma } from ".";
import { snowflake } from "@shared/snowflake";
import { MessageType } from "@shared/api-types";
import { Prisma } from "@prisma/client";
import { MessageInclude, MessagePayload } from "./database-common";

const messagesExtention = Prisma.defineExtension({
   model: {
      message: {
         async getById<Include extends MessageInclude>(channelId: Snowflake, messageId: Snowflake, include?: Include) {
            await prisma.channel.assertChannelExists("getById", channelId);

            const message = await prisma.message.findUnique({ where: { channelId: channelId, id: messageId }, include: include });

            assertObjectWithCause("getById", message, DBErrorType.NULL_MESSAGE, messageId);
            return message as MessagePayload<Include>;
         },
         async getMessages<Include extends MessageInclude>(channelId: Snowflake, limit: number, include?: Include) {
            await prisma.channel.assertChannelExists("getMessages", channelId);

            const messages = await prisma.message.findMany({ where: { channelId: channelId }, include: include, take: -limit });

            assertObjectWithCause("getMessages", messages, DBErrorType.NULL_MESSAGE);
            return messages as MessagePayload<Include>[];
         },
         async createDefaultMessage<Include extends MessageInclude>(
            authorId: Snowflake,
            channelId: Snowflake,
            content?: string,
            attachments?: string[],
            flags?: number,
            include?: Include
         ) {
            await prisma.user.assertUserExists("createDefaultMessage", authorId);
            await prisma.channel.assertChannelExists("createDefaultMessage", channelId);

            const message = await prisma.message.create({
               data: {
                  id: snowflake.generate(),
                  type: MessageType.DEFAULT,
                  channelId: channelId,
                  content: content || "",
                  attachments: attachments,
                  authorId: authorId,
                  createdAt: new Date(),
                  editedAt: null,
                  pinned: false,
                  mentionIds: [],
                  reactions: [],
                  flags: flags,
               },
               include: include,
            });

            assertObjectWithCause("createDefaultMessage", message, DBErrorType.NULL_MESSAGE);
            return message as MessagePayload<Include>;
         },
      },
   },
});

export default messagesExtention;
