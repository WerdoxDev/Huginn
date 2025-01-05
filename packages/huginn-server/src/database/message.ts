import { DBErrorType } from "@huginn/backend-shared/types";
import type { Snowflake } from "@huginn/shared";
import { WorkerID, snowflake } from "@huginn/shared";
import type { MessageType } from "@huginn/shared";
import { type Embed, Prisma } from "@prisma/client";
import type { DBEmbed } from "#utils/types";
import { assertExists, assertId, assertObj, prisma } from ".";

const messagesExtension = Prisma.defineExtension({
	model: {
		message: {
			async getById<Args extends Prisma.MessageDefaultArgs>(channelId: Snowflake, messageId: Snowflake, args?: Args) {
				try {
					assertId("getById", channelId, messageId);
					const message = await prisma.message.findUnique({
						where: { channelId: BigInt(channelId), id: BigInt(messageId) },
						...args,
					});

					assertObj("getById", message, DBErrorType.NULL_MESSAGE, messageId);
					return message as Prisma.MessageGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "getById", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "getById", DBErrorType.NULL_MESSAGE, [messageId]);
					throw e;
				}
			},
			async getMessages<Args extends Prisma.MessageDefaultArgs>(
				channelId: Snowflake,
				limit: number,
				before?: Snowflake,
				after?: Snowflake,
				args?: Args,
			) {
				try {
					const cursor = after ?? before;
					const direction = after ? "forward" : before ? "backward" : "none";

					const messages = await prisma.message.findMany({
						where: { channelId: BigInt(channelId) },
						...args,
						cursor: cursor ? { id: BigInt(cursor) } : undefined,
						skip: direction === "none" ? undefined : 1,
						take: (direction === "forward" ? 1 : -1) * limit,
					});

					assertObj("getMessages", messages, DBErrorType.NULL_MESSAGE);
					return messages as Prisma.MessageGetPayload<Args>[];
				} catch (e) {
					await assertExists(e, "getMessages", DBErrorType.NULL_CHANNEL, [channelId]);
					throw e;
				}
			},
			async createMessage<Args extends Prisma.MessageDefaultArgs>(
				authorId: Snowflake,
				channelId: Snowflake,
				type: MessageType,
				content?: string,
				attachments?: string[],
				embeds?: DBEmbed[],
				mentions?: Snowflake[],
				flags?: number,
				args?: Args,
			) {
				try {
					const createdEmbeds: Embed[] = [];

					if (embeds) {
						for (const embed of embeds) {
							createdEmbeds.push(
								await prisma.embed.createEmbed(embed.title, embed.description, embed.url, embed.timestamp, embed.type, embed.thumbnail),
							);
						}
					}

					const message = await prisma.message.create({
						data: {
							id: snowflake.generate(WorkerID.MESSAGE),
							type: type,
							channelId: BigInt(channelId),
							content: content ?? "",
							attachments: attachments,
							mentions: { connect: mentions?.map((x) => ({ id: BigInt(x) })) },
							authorId: BigInt(authorId),
							timestamp: new Date(),
							embeds: embeds ? { connect: createdEmbeds.map((x) => ({ id: x.id })) } : undefined,
							editedTimestamp: null,
							pinned: false,
							reactions: [],
							flags: flags,
						},
						...args,
					});

					// Has select none with {id : true}
					await prisma.channel.update({ where: { id: BigInt(channelId) }, data: { lastMessageId: message.id }, select: { id: true } });

					assertObj("createDefaultMessage", message, DBErrorType.NULL_MESSAGE);
					return message as Prisma.MessageGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "createDefaultMessage", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "createDefaultMessage", DBErrorType.NULL_USER, [authorId]);
					throw e;
				}
			},
			async updateMessage<Args extends Prisma.MessageDefaultArgs>(id: Snowflake, content?: string, embeds?: DBEmbed[], args?: Args) {
				try {
					const createdEmbeds: Embed[] = [];

					if (embeds) {
						for (const embed of embeds) {
							createdEmbeds.push(
								await prisma.embed.createEmbed(embed.title, embed.description, embed.url, embed.timestamp, embed.type, embed.thumbnail),
							);
						}
					}

					const message = await prisma.message.update({
						where: { id: BigInt(id) },
						data: {
							content: content,
							embeds: embeds ? { set: createdEmbeds.map((x) => ({ id: x.id })) } : { set: [] },
							editedTimestamp: new Date(),
						},
						...args,
					});

					assertObj("updateMessage", message, DBErrorType.NULL_MESSAGE);
					return message as Prisma.MessageGetPayload<Args>;
				} catch (e) {
					await assertExists(e, "updateMessage", DBErrorType.NULL_MESSAGE, [id]);
					throw e;
				}
			},
		},
	},
});

export default messagesExtension;
