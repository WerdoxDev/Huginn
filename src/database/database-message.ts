import { Snowflake } from "@shared/types";
import { DBError, DatabaseUser, assertMessageIsDefined } from ".";
import { DefaultMessage, Message } from "./schemas/message-schema";
import { snowflake } from "@shared/snowflake";
import { MessageType } from "@shared/api-types";
import { DatabaseChannel } from "./database-channel";

export class DatabaseMessage {
   static async getMessageById(channelId: Snowflake, messageId: Snowflake) {
      try {
         const message = await Message.findOne({ _id: messageId, channelId: channelId }).exec();
         assertMessageIsDefined(message);
         return message;
      } catch (e) {
         throw new DBError(e, "getMessageById");
      }
   }

   static async getMessages(channelId: Snowflake, limit: number) {
      try {
         await DatabaseChannel.getChannelById(channelId);

         const messages = await Message.find({ channelId: channelId }, undefined, { limit: limit }).exec();
         assertMessageIsDefined(messages);
         return messages;
      } catch (e) {
         throw new DBError(e, "getMessages");
      }
   }

   // TODO: implement attachments
   // TODO: implement mentions, reactions...
   // TODO: implement flags
   static async createDefaultMessage(
      authorId: Snowflake,
      channelId: Snowflake,
      content?: string,
      attachments?: unknown,
      flags?: number,
   ) {
      try {
         const authorUser = await DatabaseUser.getUserById(authorId, "_id username displayName avatar flags");
         const createdAt = new Date().toISOString();

         await DatabaseChannel.getChannelById(channelId);

         const message = await DefaultMessage.create({
            _id: snowflake.generate(),
            type: MessageType.DEFAULT,
            channelId: channelId,
            content: content,
            attachments: attachments,
            author: authorUser,
            createdAt: createdAt,
            editedAt: null,
            pinned: false,
            mentions: [],
            flags: flags,
         });

         assertMessageIsDefined(message);
         return message;
      } catch (e) {
         throw new DBError(e, "createDefaultMessage");
      }
   }
}
