import { ChannelType, type Snowflake, WorkerID, analytics, idFix, recordSpanError, snowflake } from "@huginn/shared";

import { assertExists, Prisma, prisma, type ChannelArgs, type ChannelPayload } from "#database";
import { DBErrorType } from "#types";

import { assertId, assertObj } from "./error";

export const channelExtension = Prisma.defineExtension({
   model: {
      channel: {
         async getById<Args extends ChannelArgs>(id: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.getById", async (span) => {
               span.setAttribute("query.channel.id", id);
               const methodName = "channel.getById";
               assertId(methodName, id);
               try {
                  const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, ...args });

                  span.setAttribute("channel.exists", !!channel);

                  assertObj(methodName, channel, DBErrorType.NULL_CHANNEL, id);
                  return idFix(channel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [id]);
                  throw e;
               }
            });
         },
         async getUserChannels<Args extends ChannelArgs>(userId: Snowflake, includeDeleted: boolean, args?: Args) {
            return analytics.startActiveSpan("db.channel.getUserChannels", async (span) => {
               span.setAttributes({ "query.user.id": userId, "query.include_deleted": includeDeleted });
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

                  span.setAttribute("channels.count", channels.length);
                  assertObj(methodName, channels, DBErrorType.NULL_CHANNEL);
                  return idFix(channels) as ChannelPayload<Args>[];
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
         async createDirect<Args extends ChannelArgs>(initiatorId: Snowflake, recipients: Snowflake[], name?: string, args?: Args) {
            return analytics.startActiveSpan("db.channel.createDirect", async (span) => {
               const methodName = "channel.createDirect";
               const isGroup = recipients.length > 1;
               span.setAttributes({
                  "query.user.id": initiatorId,
                  "query.recipient_count": recipients.length,
                  "query.has_name": !!name,
                  "query.is_group": isGroup,
               });

               assertId(methodName, initiatorId, ...recipients);

               try {
                  let channel;
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

                  if (existingChannel) span.setAttribute("existing_channel.id", existingChannel.id.toString());

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

                  span.setAttribute("channel.id", channel.id.toString());

                  assertObj(methodName, channel, DBErrorType.NULL_CHANNEL);
                  return idFix(channel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [initiatorId, ...recipients]);
                  throw e;
               }
            });
         },
         async editDirect<Args extends ChannelArgs>(channelId: Snowflake, name?: string | null, icon?: string | null, owner?: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.editDirect", async (span) => {
               const methodName = "channel.editDirect";

               span.setAttributes({
                  "query.channel.id": channelId,
                  "query.has_name": !!name,
                  "query.has_icon": !!icon,
                  "query.has_owner": !!owner,
               });

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

                  span.setAttribute("channel.id", updatedChannel.id.toString());

                  assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
                  return idFix(updatedChannel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [owner]);
                  throw e;
               }
            });
         },
         async addRecipient<Args extends ChannelArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.addRecipient", async (span) => {
               const methodName = "channel.addRecipient";
               span.setAttributes({ "query.channel.id": channelId, "query.user.id": recipientId });
               assertId(methodName, channelId);
               try {
                  const updatedChannel = await prisma.channel.update({
                     where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
                     data: { recipients: { connect: { id: BigInt(recipientId) } } },
                     ...args,
                  });

                  span.setAttribute("channel.id", updatedChannel.id.toString());

                  assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
                  return idFix(updatedChannel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [recipientId]);
                  throw e;
               }
            });
         },
         async removeRecipient<Args extends ChannelArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.removeRecipient", async (span) => {
               const methodName = "channel.removeRecipient";
               span.setAttributes({ "query.channel.id": channelId, "query.user.id": recipientId });
               assertId(methodName, channelId);
               try {
                  const updatedChannel = await prisma.channel.update({
                     where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
                     data: { recipients: { disconnect: { id: BigInt(recipientId) } } },
                     ...args,
                  });

                  span.setAttribute("channel.id", updatedChannel.id.toString());

                  assertObj(methodName, updatedChannel, DBErrorType.NULL_CHANNEL);
                  return idFix(updatedChannel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [recipientId]);
                  throw e;
               }
            });
         },
         async leaveDirect<Args extends ChannelArgs>(channelId: Snowflake, userId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.leaveDirect", async (span) => {
               const methodName = "channel.leaveDirect";
               span.setAttributes({ "query.channel.id": channelId, "query.user.id": userId });
               assertId(methodName, channelId);
               try {
                  const channel = await prisma.channel.getById(channelId, { select: { type: true } });

                  span.setAttribute("channel.type", channel.type);

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

                  span.setAttribute("edited_channel.id", channelId.toString());

                  assertObj(methodName, editedChannel, DBErrorType.NULL_CHANNEL);
                  return idFix(editedChannel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  await assertExists(e, methodName, DBErrorType.NULL_USER, [userId]);
                  throw e;
               }
            });
         },
         async deleteGroupDirect<Args extends ChannelArgs>(channelId: Snowflake, args?: Args) {
            return analytics.startActiveSpan("db.channel.deleteGroupDirect", async (span) => {
               const methodName = "channel.deleteGroupDirect";
               span.setAttribute("query.channel.id", channelId);
               assertId(methodName, channelId);

               try {
                  const deletedChannel = await prisma.channel.delete({ where: { id: BigInt(channelId), type: ChannelType.GROUP_DM }, ...args });

                  span.setAttribute("deleted_channel.id", deletedChannel.id.toString());
                  assertObj(methodName, deletedChannel, DBErrorType.NULL_CHANNEL);
                  return idFix(deletedChannel) as ChannelPayload<Args>;
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  throw e;
               }
            });
         },
         async getRecipients(channelId: Snowflake) {
            return analytics.startActiveSpan("db.channel.getRecipients", async (span) => {
               const methodName = "channel.getRecipients";
               span.setAttribute("query.channel.id", channelId);
               assertId(methodName, channelId);
               try {
                  const recipients = await prisma.channel
                     .findUnique({
                        where: { id: BigInt(channelId) },
                        select: { recipients: { select: { id: true, username: true, displayName: true } } },
                     })
                     .then((x) => x?.recipients ?? []);
                  return idFix(recipients);
               } catch (e) {
                  recordSpanError(e);
                  await assertExists(e, methodName, DBErrorType.NULL_CHANNEL, [channelId]);
                  throw e;
               }
            });
         },
      },
   },
});
