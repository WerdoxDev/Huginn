import { Prisma } from "@prisma/client";
import { ChannelType } from "@shared/api-types";
import { snowflake, Snowflake } from "@shared/snowflake";
import { prisma } from ".";
import { ChannelInclude, ChannelPayload } from "./database-common";
import { assertBoolWithCause, assertObjectWithCause, DBErrorType } from "./database-error";

const channelExtention = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Include extends ChannelInclude>(id: Snowflake, include?: Include) {
            const channel = await prisma.channel.findUnique({ where: { id: id }, include: include });

            assertObjectWithCause("getById", channel, DBErrorType.NULL_CHANNEL, id);
            return channel as ChannelPayload<Include>;
         },
         async getUserChannels<Include extends ChannelInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("getUserChannels", userId);

            const channels = await prisma.channel.findMany({
               where: { recipientIds: { has: userId } },
               include: include,
            });

            assertObjectWithCause("getUserChannels", channels, DBErrorType.NULL_CHANNEL);
            return channels as ChannelPayload<Include>[];
         },
         async createSingleDM<Include extends ChannelInclude>(firstUserId: Snowflake, secondUserId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("createSingleDM", firstUserId);
            await prisma.user.assertUserExists("createSingleDM", secondUserId);
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

            assertObjectWithCause("createSingleDM", channel, DBErrorType.NULL_CHANNEL);
            return channel as ChannelPayload<Include>;
         },
         async createGroupDM<Include extends ChannelInclude>(ownerId: Snowflake, users: Record<Snowflake, string>, include?: Include) {
            const finalName = Object.values(users).join(", ");

            await prisma.user.assertUserExists("createGroupDM", ownerId);

            for (const recipientId in users) {
               if (Object.hasOwn(users, recipientId)) {
                  await prisma.user.assertUserExists("createGroupDM", recipientId);
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

            assertObjectWithCause("createGroupDM", channel, DBErrorType.NULL_CHANNEL);
            return channel as ChannelPayload<Include>;
         },
         async assertChannelExists(methodName: string, id: Snowflake) {
            assertBoolWithCause(methodName, !(await prisma.channel.exists({ id })), DBErrorType.NULL_CHANNEL, id);
         },
      },
   },
});

export default channelExtention;
