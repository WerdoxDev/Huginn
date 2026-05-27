import { assertExists, Prisma, prisma, type ChannelArgs, type ChannelPayload } from "#database";
import { DBErrorType } from "#types";
import { ChannelType, type Snowflake, WorkerID, idFix, snowflake } from "@huginn/shared";

import { assertId, assertObj } from "./error";

export const channelExtension = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Args extends ChannelArgs>(id: Snowflake, args?: Args) {
            const methodName = "channel.getById";
            assertId(methodName, id);
            const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, ...args });

            assertObj(methodName, channel, DBErrorType.NULL_CHANNEL, id);
            return idFix(channel) as ChannelPayload<Args>;
         },
         async getUserChannels<Args extends ChannelArgs>(userId: Snowflake, includeDeleted: boolean, args?: Args) {
            const methodName = "channel.getUserChannels";
            assertId(methodName, userId);
            try {
               const channels = await prisma.channel.findMany({
                  where: {
                     recipients: { some: { id: BigInt(userId) } },
                     tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : undefined,
                  },
                  ...args,
               });

               assertObj(methodName, channels, DBErrorType.NULL_CHANNEL);
               return idFix(channels) as ChannelPayload<Args>[];
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
               throw e;
            }
         },
         async createDirect<Args extends ChannelArgs>(initiatorId: Snowflake, recipients: Snowflake[], name?: string, args?: Args) {
            const methodName = "channel.createDirect";
            assertId(methodName, initiatorId, ...recipients);
            try {
               let channel;
               const isGroup = recipients.length > 1;
               const recipientsConnect = [{ id: BigInt(initiatorId) }, ...recipients.map((x) => ({ id: BigInt(x) }))];

               // See if we got a channel where all recipients are either initiator or first recipient
               const existingChannel = await prisma.channel.findFirst({
                  where: {
                     recipients: {
                        every: { OR: [{ id: BigInt(recipients[0]) }, { id: BigInt(initiatorId) }] },
                     },
                     type: ChannelType.DM,
                  },
                  select: { id: true },
               });

               if (!isGroup && existingChannel) {
                  channel = await prisma.channel.update({
                     where: { id: existingChannel.id },
                     data: { tempDeletedByUsers: { disconnect: { id: BigInt(initiatorId) } } },
                     ...args,
                  });
               } else {
                  channel = await prisma.channel.create({
                     data: {
                        id: snowflake.generate(WorkerID.CHANNEL),
                        type: isGroup ? ChannelType.GROUP_DM : ChannelType.DM,
                        lastMessageId: null,
                        icon: null,
                        name: isGroup ? (name === "" ? null : name) : null,
                        ownerId: isGroup ? BigInt(initiatorId) : undefined,
                        recipients: {
                           connect: recipientsConnect,
                        },
                     },
                     ...args,
                  });
               }

               assertObj(methodName, channel, DBErrorType.NULL_CHANNEL);
               return idFix(channel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_USER, [initiatorId, ...recipients]);
               throw e;
            }
         },
         async editDirect<Args extends ChannelArgs>(
            channelId: Snowflake,
            name?: string | null,
            icon?: string | null,
            owner?: Snowflake,
            args?: Args,
         ) {
            const methodName = "channel.editDirect";
            assertId(methodName, channelId);
            try {
               const updatedChannel = await prisma.channel.update({
                  where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
                  data: {
                     icon: icon,
                     name: name === "" ? null : name,
                     owner: owner ? { connect: { id: BigInt(owner) } } : undefined,
                  },
                  ...args,
               });

               assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
               return idFix(updatedChannel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [owner]);
               throw e;
            }
         },
         async addRecipient<Args extends ChannelArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
            const methodName = "channel.addRecipient";
            assertId(methodName, channelId);
            try {
               const updatedChannel = await prisma.channel.update({
                  where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
                  data: { recipients: { connect: { id: BigInt(recipientId) } } },
                  ...args,
               });

               assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
               return idFix(updatedChannel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [recipientId]);
               throw e;
            }
         },
         async removeRecipient<Args extends ChannelArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
            const methodName = "channel.removeRecipient";
            try {
               assertId(methodName, channelId);

               const updatedChannel = await prisma.channel.update({
                  where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
                  data: { recipients: { disconnect: { id: BigInt(recipientId) } } },
                  ...args,
               });

               assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
               return idFix(updatedChannel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [recipientId]);
               throw e;
            }
         },
         async leaveDirect<Args extends ChannelArgs>(channelId: Snowflake, userId: Snowflake, args?: Args) {
            const methodName = "channel.leaveDirect";
            assertId(methodName, channelId);
            try {
               const channel = await prisma.channel.getById(channelId, { select: { type: true } });

               let editedChannel: unknown | undefined;

               if (channel.type === ChannelType.GROUP_DM) {
                  editedChannel = await prisma.channel.update({
                     where: { id: BigInt(channelId) },
                     data: { recipients: { disconnect: { id: BigInt(userId) } } },
                     ...args,
                  });
               } else if (channel.type === ChannelType.DM) {
                  editedChannel = await prisma.channel.update({
                     where: { id: BigInt(channelId) },
                     data: { tempDeletedByUsers: { connect: { id: BigInt(userId) } } },
                     ...args,
                  });
               }

               assertObj(methodName, editedChannel, DBErrorType.NULL_CHANNEL);
               return idFix(editedChannel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
               throw e;
            }
         },
         async deleteGroupDirect<Args extends ChannelArgs>(channelId: Snowflake, args?: Args) {
            const methodName = "channel.deleteGroupDirect";
            assertId(methodName, channelId);

            try {
               const deletedChannel = await prisma.channel.delete({ where: { id: BigInt(channelId), type: ChannelType.GROUP_DM }, ...args });

               assertObj(methodName, deletedChannel, DBErrorType.NULL_CHANNEL);
               return idFix(deletedChannel) as ChannelPayload<Args>;
            } catch (e) {
               await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
               throw e;
            }
         },
      },
   },
});
