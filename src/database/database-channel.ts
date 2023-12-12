import { Snowflake } from "@shared/types";
import { Channel, DMChannel, GroupDMChannel } from "./channel-schema";
import { DBError, assertChannelIsDefined } from "./database-error";
import { snowflake } from "@shared/snowflake";
import { ChannelType } from "@shared/api-types";
import { DatabaseUser } from ".";
import { APIUser } from "@shared/api-types";

export class DatabaseChannel {
   static async getChannelById(id: Snowflake) {
      try {
         const channel = await Channel.findById(id).exec();
         assertChannelIsDefined(channel);
         return channel;
      } catch (e) {
         throw new DBError(e, "getChannelById");
      }
   }

   static async getUserChannels(userId: Snowflake) {
      try {
         const channels = await Channel.find({ recipients: { $elemMatch: { _id: userId } } }).exec();
         assertChannelIsDefined(channels);
         return channels;
      } catch (e) {
         throw new DBError(e, "getUserChannels");
      }
   }

   static async createSingleDMChannel(firstUserId: Snowflake, secondUserId: Snowflake) {
      try {
         const firstUser = await DatabaseUser.getUserById(firstUserId, "_id username avatar");
         const secondUser = await DatabaseUser.getUserById(secondUserId, "_id username avatar");

         const channel = await DMChannel.create({
            _id: snowflake.generate(),
            type: ChannelType.DM,
            lastMessageId: null,
            recipients: [firstUser.toObject(), secondUser.toObject()],
         });

         assertChannelIsDefined(channel);
         return channel;
      } catch (e) {
         throw new DBError(e, "createSingleDMChannel");
      }
   }

   static async createGroupDMChannel(ownerId: Snowflake, users: Record<Snowflake, string>) {
      try {
         const recipients: APIUser[] = [];
         const finalName = Object.values(users).join(", ");

         const ownerUser = await DatabaseUser.getUserById(ownerId, "_id username avatar");

         for (const recipientId in users) {
            if (Object.hasOwn(users, recipientId)) {
               const user = await DatabaseUser.getUserById(recipientId, "_id username avatar");
               recipients.push(user);
            }
         }

         const channel = await GroupDMChannel.create({
            _id: snowflake.generate(),
            name: finalName,
            type: ChannelType.GROUP_DM,
            ownerId: ownerId,
            icon: null,
            lastMessageId: null,
            recipients: [ownerUser, ...recipients],
         });

         assertChannelIsDefined(channel);
         return channel;
      } catch (e) {
         throw new DBError(e, "createGroupDMChannel");
      }
   }
}
