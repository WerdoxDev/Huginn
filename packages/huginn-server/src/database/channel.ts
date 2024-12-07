import { type APIPatchDMChannelJSONBody, ChannelType, type Snowflake, WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertExists, prisma } from ".";
import type { ChannelInclude, ChannelPayload, ChannelSelect } from "./common";
import { DBErrorType, assertCondition, assertId, assertObj, isPrismaError } from "./error";

const channelExtention = Prisma.defineExtension({
	model: {
		channel: {
			async getById<Include extends ChannelInclude, Select extends ChannelSelect>(id: Snowflake, include?: Include, select?: Select) {
				assertId("getById", id);
				const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, include: include, select: select });

				assertObj("getById", channel, DBErrorType.NULL_CHANNEL, id);
				return channel as ChannelPayload<Include, Select>;
			},
			async getUserChannels<Include extends ChannelInclude>(userId: Snowflake, includeDeleted: boolean, include?: Include) {
				try {
					const dmChannels = await prisma.channel.findMany({
						where: {
							recipients: { some: { id: BigInt(userId) } },
							type: ChannelType.DM,
							tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : undefined,
						},
						include: include,
						omit: { icon: true, ownerId: true, name: true },
					});

					const groupChannels = await prisma.channel.findMany({
						where: {
							recipients: { some: { id: BigInt(userId) } },
							type: ChannelType.GROUP_DM,
							tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : undefined,
						},
						include: include,
					});

					const channels = [...groupChannels, ...dmChannels];

					assertObj("getUserChannels", channels, DBErrorType.NULL_CHANNEL);
					return channels as ChannelPayload<Include>[];
				} catch (e) {
					await assertExists(e, "getUserChannels", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
			async createDM<Include extends ChannelInclude>(initiatorId: Snowflake, recipients: Snowflake[], name?: string, include?: Include) {
				try {
					let channel: ChannelPayload<Include> | undefined;
					const isGroup = recipients.length > 1;
					const recipientsConnect = [{ id: BigInt(initiatorId) }, ...recipients.map((x) => ({ id: BigInt(x) }))];

					// See if we got a channel where all recipients are either initiator or first recipient
					const existingChannel = await prisma.channel.findFirst({
						where: { recipients: { every: { OR: [{ id: BigInt(recipients[0]) }, { id: BigInt(initiatorId) }] } }, type: ChannelType.DM },
					});

					if (!isGroup && existingChannel) {
						channel = (await prisma.channel.update({
							where: { id: existingChannel.id },
							data: { tempDeletedByUsers: { disconnect: { id: BigInt(initiatorId) } } },
							include: include,
							omit: { icon: true, name: true, ownerId: true },
						})) as ChannelPayload<Include>;
					} else if (!isGroup) {
						channel = (await prisma.channel.create({
							data: {
								id: snowflake.generate(WorkerID.CHANNEL),
								type: ChannelType.DM,
								lastMessageId: null,
								recipients: {
									connect: recipientsConnect,
								},
							},
							include: include,
							omit: { icon: true, name: true, ownerId: true },
						})) as ChannelPayload<Include>;
					} else if (isGroup) {
						channel = (await prisma.channel.create({
							data: {
								id: snowflake.generate(WorkerID.CHANNEL),
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
						})) as ChannelPayload<Include>;
					}

					assertObj("createDM", channel, DBErrorType.NULL_CHANNEL);
					return channel as ChannelPayload<Include>;
				} catch (e) {
					await assertExists(e, "createDM", DBErrorType.NULL_USER, [initiatorId, ...recipients]);
					throw e;
				}
			},
			async editDM<Include extends ChannelInclude>(channelId: Snowflake, editedDM: APIPatchDMChannelJSONBody, include?: Include) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { icon: editedDM.icon, name: editedDM.name, owner: editedDM.owner ? { connect: { id: BigInt(editedDM.owner) } } : undefined },
						include: include,
					});

					assertObj("editDM", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as ChannelPayload<Include>;
				} catch (e) {
					await assertExists(e, "editDM", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "editDM", DBErrorType.NULL_USER, [editedDM.owner]);
					throw e;
				}
			},
			async addRecipient<Include extends ChannelInclude>(channelId: Snowflake, recipientId: Snowflake, include?: Include) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { recipients: { connect: { id: BigInt(recipientId) } } },
						include: include,
					});

					assertObj("addRecipient", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as ChannelPayload<Include>;
				} catch (e) {
					await assertExists(e, "addRecipient", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "addRecipient", DBErrorType.NULL_USER, [recipientId]);
					throw e;
				}
			},
			async removeRecipient<Include extends ChannelInclude>(channelId: Snowflake, recipientId: Snowflake, include?: Include) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { recipients: { disconnect: { id: BigInt(recipientId) } } },
						include: include,
					});

					assertObj("removeRecipient", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as ChannelPayload<Include>;
				} catch (e) {
					await assertExists(e, "removeRecipient", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "removeRecipient", DBErrorType.NULL_USER, [recipientId]);
					throw e;
				}
			},
			async deleteDM<Include extends ChannelInclude>(channelId: Snowflake, userId: Snowflake, include?: Include) {
				try {
					const channel = await prisma.channel.getById(channelId, undefined, { type: true });

					let editedChannel: ChannelPayload<Include> | undefined;

					if (channel.type === ChannelType.GROUP_DM) {
						editedChannel = (await prisma.channel.update({
							where: { id: BigInt(channelId) },
							data: { recipients: { disconnect: { id: BigInt(userId) } } },
							include: include,
						})) as ChannelPayload<Include>;
					} else if (channel.type === ChannelType.DM) {
						editedChannel = (await prisma.channel.update({
							where: { id: BigInt(channelId) },
							data: { tempDeletedByUsers: { connect: { id: BigInt(userId) } } },
							include: include,
							omit: { icon: true, ownerId: true, name: true },
						})) as ChannelPayload<Include>;
					}

					assertObj("deleteDM", editedChannel, DBErrorType.NULL_CHANNEL);
					return editedChannel as ChannelPayload<Include>;
				} catch (e) {
					await assertExists(e, "deleteDM", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "deleteDM", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
		},
	},
});

export default channelExtention;
