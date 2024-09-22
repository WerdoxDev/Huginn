import { Prisma } from "@prisma/client";
import { ChannelType } from "@huginn/shared";
import { snowflake, Snowflake } from "@huginn/shared";
import { prisma } from ".";
import { ChannelInclude, ChannelPayload } from "./common";
import { assertCondition, assertId, assertObj, DBErrorType } from "./error";

const channelExtention = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Include extends ChannelInclude>(id: Snowflake, include?: Include) {
            assertId("getById", id);
            const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, include: include });

            assertObj("getById", channel, DBErrorType.NULL_CHANNEL, id);
            return channel as ChannelPayload<Include>;
         },
         async getUserChannels<Include extends ChannelInclude>(userId: Snowflake, includeDeleted: boolean, include?: Include) {
            await prisma.user.assertUserExists("getUserChannels", userId);

            const dmChannels = await prisma.channel.findMany({
               where: {
                  recipients: { some: { id: BigInt(userId) } },
                  type: ChannelType.DM,
                  tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : {},
               },
               include: include,
               omit: { icon: true, ownerId: true, name: true },
            });

            const groupChannels = await prisma.channel.findMany({
               where: {
                  recipients: { some: { id: BigInt(userId) } },
                  type: ChannelType.GROUP_DM,
                  tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : {},
               },
               include: include,
            });

            const channels = [...groupChannels, ...dmChannels];

            assertObj("getUserChannels", channels, DBErrorType.NULL_CHANNEL);
            return channels as ChannelPayload<Include>[];
         },
         async createDM<Include extends ChannelInclude>(
            initiatorId: Snowflake,
            recipients: Snowflake[],
            name?: string,
            include?: Include,
         ) {
            await prisma.user.assertUserExists("createDM", initiatorId);

            for (const recipientId of recipients) {
               await prisma.user.assertUserExists("createDM", recipientId);
            }

            let channel;
            const isGroup = recipients.length > 1;
            const recipientsConnect = [{ id: BigInt(initiatorId) }, ...recipients.map(x => ({ id: BigInt(x) }))];

            // See if we got a channel where all recipients are either initiator or first recipient
            const existingChannel = await prisma.channel.findFirst({
               where: { recipients: { every: { OR: [{ id: BigInt(recipients[0]) }, { id: BigInt(initiatorId) }] } } },
            });

            if (!isGroup && existingChannel) {
               channel = await prisma.channel.update({
                  where: { id: existingChannel.id },
                  data: { tempDeletedByUsers: { disconnect: { id: BigInt(initiatorId) } } },
                  include: include,
                  omit: { icon: true, name: true, ownerId: true },
               });
            } else if (!isGroup) {
               channel = await prisma.channel.create({
                  data: {
                     id: snowflake.generate(),
                     type: ChannelType.DM,
                     lastMessageId: null,
                     recipients: {
                        connect: recipientsConnect,
                     },
                  },
                  include: include,
                  omit: { icon: true, name: true, ownerId: true },
               });
            } else if (isGroup) {
               channel = await prisma.channel.create({
                  data: {
                     id: snowflake.generate(),
                     type: ChannelType.GROUP_DM,
                     name: name ? name : null,
                     icon: null,
                     lastMessageId: null,
                     ownerId: BigInt(initiatorId),
                     recipients: {
                        connect: recipientsConnect,
                     },
                  },
                  include: include,
               });
            }

            assertObj("createDM", channel, DBErrorType.NULL_CHANNEL);
            return channel as ChannelPayload<Include>;
         },
         async deleteDM<Include extends ChannelInclude>(channelId: Snowflake, userId: Snowflake, include?: Include) {
            await prisma.channel.assertChannelExists("deleteDM", channelId);
            await prisma.user.assertUserExists("deleteDM", userId);

            const channel = await prisma.channel.update({
               where: { id: BigInt(channelId) },
               data: { tempDeletedByUsers: { connect: { id: BigInt(userId) } } },
               include: include,
            });

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
