import { Snowflake } from "@shared/types";
import { assertMessageIsDefined, prisma } from ".";
import { snowflake } from "@shared/snowflake";
import { MessageType } from "@shared/api-types";
import { Prisma } from "@prisma/client";
import { MessageInclude, MessagePayload } from "./database-common";

const messagesExtention = Prisma.defineExtension({
   model: {
      message: {
         async getById<Include extends MessageInclude>(channelId: Snowflake, messageId: Snowflake, include?: Include) {
            await prisma.channel.getById(channelId);

            const message = await prisma.message.findUnique({ where: { channelId: channelId, id: messageId }, include: include });

            assertMessageIsDefined("getById", message, messageId);
            return message as MessagePayload<Include>;
         },
         async getMessages<Include extends MessageInclude>(channelId: Snowflake, limit: number, include?: Include) {
            await prisma.channel.getById(channelId);

            const messages = await prisma.message.findMany({ where: { channelId: channelId }, include: include, take: -limit });

            assertMessageIsDefined("getMessages", messages);
            return messages as MessagePayload<Include>[];
         },
         async createDefaultMessage(
            authorId: Snowflake,
            channelId: Snowflake,
            content?: string,
            attachments?: string[],
            flags?: number,
         ) {
            await prisma.user.getById(authorId);
            await prisma.channel.getById(channelId);

            const message = prisma.message.create({
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
            });

            assertMessageIsDefined("createDefaultMessage", message);
            return message;
         },
      },
   },
});

export default messagesExtention;
