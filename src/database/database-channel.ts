import { Prisma } from "@prisma/client";
import { ChannelType } from "@shared/api-types";
import { snowflake, Snowflake } from "@shared/snowflake";
import { prisma } from ".";
import { ChannelInclude, ChannelPayload } from "./database-common";
import { assertCondition, assertId, assertObj, DBErrorType } from "./database-error";

const channelExtention = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Include extends ChannelInclude>(id: Snowflake, include?: Include) {
            assertId("getById", id);
            const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, include: include });

            assertObj("getById", channel, DBErrorType.NULL_CHANNEL, id);
            return channel as ChannelPayload<Include>;
         },
         async getUserChannels<Include extends ChannelInclude>(userId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("getUserChannels", userId);

            const channels = await prisma.channel.findMany({
               where: { recipients: { some: { id: BigInt(userId) } } },
               include: include,
            });

            assertObj("getUserChannels", channels, DBErrorType.NULL_CHANNEL);
            return channels as ChannelPayload<Include>[];
         },
         async createSingleDM<Include extends ChannelInclude>(firstUserId: Snowflake, secondUserId: Snowflake, include?: Include) {
            await prisma.user.assertUserExists("createSingleDM", firstUserId);
            await prisma.user.assertUserExists("createSingleDM", secondUserId);

            const channel = await prisma.channel.create({
               data: {
                  id: snowflake.generate(),
                  type: ChannelType.DM,
                  lastMessageId: null,
                  recipients: { connect: [{ id: BigInt(firstUserId) }, { id: BigInt(secondUserId) }] },
               },
               include: include,
            });

            assertObj("createSingleDM", channel, DBErrorType.NULL_CHANNEL);
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
                  ownerId: BigInt(ownerId),
                  icon: null,
                  lastMessageId: null,
                  recipients: {
                     connect: [{ id: BigInt(ownerId) }, ...Object.keys(users).map(x => ({ id: BigInt(x) }))],
                  },
               },
               include: include,
            });

            assertObj("createGroupDM", channel, DBErrorType.NULL_CHANNEL);
            return channel as ChannelPayload<Include>;
         },
         async assertChannelExists(methodName: string, id: Snowflake) {
            assertId(methodName, id);
            const channelExists = await prisma.channel.exists({ id: BigInt(id) });
            assertCondition(methodName, !channelExists, DBErrorType.NULL_CHANNEL, id);
         },
      },
   },
});

export default channelExtention;
