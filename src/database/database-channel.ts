import { Prisma } from "@prisma/client";
import { ChannelType } from "@shared/api-types";
import { snowflake } from "@shared/snowflake";
import { Snowflake } from "@shared/types";
import { prisma } from ".";
import { ChannelInclude, ChannelPayload } from "./database-common";
import { assertChannelIsDefined } from "./database-error";

const channelExtention = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Include extends ChannelInclude>(id: Snowflake, include?: Include) {
            const channel = await prisma.channel.findUnique({ where: { id: id }, include: include });

            assertChannelIsDefined("getById", channel, id);
            return channel as ChannelPayload<Include>;
         },
         async getUserChannels<Include extends ChannelInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.getById(userId);

            const channels = await prisma.channel.findMany({
               where: { recipientIds: { has: userId } },
               include: include,
            });

            assertChannelIsDefined("getUserChannels", channels);
            return channels as ChannelPayload<Include>[];
         },
         async createSingleDM<Include extends ChannelInclude>(firstUserId: Snowflake, secondUserId: Snowflake, include?: Include) {
            await prisma.user.getById(firstUserId);
            await prisma.user.getById(secondUserId);
            // const firstUser = pick(await prisma.user.getById(firstUserId), ["id", "username", "avatar"]);
            // const secondUser = pick(await prisma.user.getById(secondUserId), ["id", "username", "avatar"]);

            const channel = await prisma.channel.create({
               data: {
                  id: snowflake.generate(),
                  type: ChannelType.DM,
                  lastMessageId: null,
                  recipientIds: [firstUserId, secondUserId],
               },
               include: include,
            });

            assertChannelIsDefined("createSingleDM", channel);
            return channel as ChannelPayload<Include>;
         },
         async createGroupDM<Include extends ChannelInclude>(ownerId: Snowflake, users: Record<Snowflake, string>, include?: Include) {
            const finalName = Object.values(users).join(", ");

            await prisma.user.getById(ownerId);

            for (const recipientId in users) {
               if (Object.hasOwn(users, recipientId)) {
                  await prisma.user.getById(recipientId);
               }
            }

            const channel = await prisma.channel.create({
               data: {
                  id: snowflake.generate(),
                  name: finalName,
                  type: ChannelType.GROUP_DM,
                  ownerId: ownerId,
                  icon: null,
                  lastMessageId: null,
                  recipientIds: [ownerId, ...Object.keys(users)],
               },
               include: include,
            });

            assertChannelIsDefined("createGroupDM", channel);
            return channel as ChannelPayload<Include>;
         },
      },
   },
});

export default channelExtention;
