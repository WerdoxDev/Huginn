import { DBErrorType } from "@huginn/backend-shared/types";
import { ChannelType, type Snowflake, WorkerID, omit, omitArray, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertExists, prisma } from ".";
import { assertId, assertObj } from "./error";

export const channelExtension = Prisma.defineExtension({
	model: {
		channel: {
			async getById<Args extends Prisma.ChannelDefaultArgs>(id: Snowflake, args?: Args) {
				assertId("getById", id);
				const channel = await prisma.channel.findUnique({ where: { id: BigInt(id) }, ...args });

				assertObj("getById", channel, DBErrorType.NULL_CHANNEL, id);
				return channel as Prisma.ChannelGetPayload<Args>;
			},
			async getUserChannels<Args extends Prisma.ChannelDefaultArgs>(userId: Snowflake, includeDeleted: boolean, args?: Args) {
				try {
					const dmChannels = await prisma.channel.findMany({
						where: {
							recipients: { some: { id: BigInt(userId) } },
							type: ChannelType.DM,
							tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : undefined,
						},
						...args,
						omit: args?.select ? undefined : { icon: true, name: true, ownerId: true },
					});

					const groupChannels = await prisma.channel.findMany({
						where: {
							recipients: { some: { id: BigInt(userId) } },
							type: ChannelType.GROUP_DM,
							tempDeletedByUsers: !includeDeleted ? { none: { id: BigInt(userId) } } : undefined,
						},
						...args,
					});

					const channels = [...groupChannels, ...dmChannels];

					assertObj("getUserChannels", channels, DBErrorType.NULL_CHANNEL);
					return channels as Prisma.ChannelGetPayload<Args>[];
				} catch (e) {
					await assertExists(e, "getUserChannels", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
			async createDM<Args extends Prisma.ChannelDefaultArgs>(initiatorId: Snowflake, recipients: Snowflake[], name?: string, args?: Args) {
				try {
					let channel: unknown | undefined;
					const isGroup = recipients.length > 1;
					const recipientsConnect = [{ id: BigInt(initiatorId) }, ...recipients.map((x) => ({ id: BigInt(x) }))];

					// See if we got a channel where all recipients are either initiator or first recipient
					const existingChannel = await prisma.channel.findFirst({
						where: { recipients: { every: { OR: [{ id: BigInt(recipients[0]) }, { id: BigInt(initiatorId) }] } }, type: ChannelType.DM },
						select: { id: true },
					});

					if (!isGroup && existingChannel) {
						channel = await prisma.channel.update({
							where: { id: existingChannel.id },
							data: { tempDeletedByUsers: { disconnect: { id: BigInt(initiatorId) } } },
							...args,
							omit: { icon: true, name: true, ownerId: true },
						});
					} else if (!isGroup) {
						channel = await prisma.channel.create({
							data: {
								id: snowflake.generate(WorkerID.CHANNEL),
								type: ChannelType.DM,
								lastMessageId: null,
								recipients: {
									connect: recipientsConnect,
								},
							},
							...args,
							omit: { icon: true, name: true, ownerId: true },
						});
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
							...args,
						})) as Prisma.ChannelGetPayload<Args>;
					}

					assertObj("createDM", channel, DBErrorType.NULL_CHANNEL);
					return channel as Prisma.ChannelGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "createDM", DBErrorType.NULL_USER, [initiatorId, ...recipients]);
					throw e;
				}
			},
			async editDM<Args extends Prisma.ChannelDefaultArgs>(
				channelId: Snowflake,
				name?: string | null,
				icon?: string | null,
				owner?: Snowflake,
				args?: Args,
			) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { icon: icon, name: name, owner: owner ? { connect: { id: BigInt(owner) } } : undefined },
						...args,
					});

					assertObj("editDM", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as Prisma.ChannelGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "editDM", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "editDM", DBErrorType.NULL_USER, [owner]);
					throw e;
				}
			},
			async addRecipient<Args extends Prisma.ChannelDefaultArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { recipients: { connect: { id: BigInt(recipientId) } } },
						...args,
					});

					assertObj("addRecipient", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as Prisma.ChannelGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "addRecipient", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "addRecipient", DBErrorType.NULL_USER, [recipientId]);
					throw e;
				}
			},
			async removeRecipient<Args extends Prisma.ChannelDefaultArgs>(channelId: Snowflake, recipientId: Snowflake, args?: Args) {
				try {
					const updatedChannel = await prisma.channel.update({
						where: { id: BigInt(channelId), type: ChannelType.GROUP_DM },
						data: { recipients: { disconnect: { id: BigInt(recipientId) } } },
						...args,
					});

					assertObj("removeRecipient", updatedChannel, DBErrorType.NULL_CHANNEL);
					return updatedChannel as Prisma.ChannelGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "removeRecipient", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "removeRecipient", DBErrorType.NULL_USER, [recipientId]);
					throw e;
				}
			},
			async deleteDM<Args extends Prisma.ChannelDefaultArgs>(channelId: Snowflake, userId: Snowflake, args?: Args) {
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
							omit: { icon: true, name: true, ownerId: true },
						});
					}

					assertObj("deleteDM", editedChannel, DBErrorType.NULL_CHANNEL);
					return editedChannel as Prisma.ChannelGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "deleteDM", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "deleteDM", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
		},
	},
});
