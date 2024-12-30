import type { APIEmbed, Snowflake } from "@huginn/shared";
import { WorkerID, snowflake } from "@huginn/shared";
import type { MessageType } from "@huginn/shared";
import { type Embed, Prisma } from "@prisma/client";
import { DBErrorType, assertExists, assertId, assertObj, prisma } from ".";
import type { MessageInclude, MessageOmit, MessagePayload } from "./common";

const messagesExtension = Prisma.defineExtension({
	model: {
		message: {
			async getById<Include extends MessageInclude, Omit extends MessageOmit>(
				channelId: Snowflake,
				messageId: Snowflake,
				include?: Include,
				omit?: Omit,
			) {
				try {
					assertId("getById", channelId, messageId);
					const message = await prisma.message.findUnique({
						where: { channelId: BigInt(channelId), id: BigInt(messageId) },
						include: include,
						...(omit && { omit: omit }),
					});

					assertObj("getById", message, DBErrorType.NULL_MESSAGE, messageId);
					return message as MessagePayload<Include, Omit>;
				} catch (e) {
					await assertExists(e, "getById", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "getById", DBErrorType.NULL_MESSAGE, [messageId]);
					throw e;
				}
			},
			async getMessages<Include extends MessageInclude, Omit extends MessageOmit>(
				channelId: Snowflake,
				limit: number,
				before?: Snowflake,
				after?: Snowflake,
				include?: Include,
				omit?: Omit,
			) {
				try {
					const cursor = after ?? before;
					const direction = after ? "forward" : before ? "backward" : "none";

					const messages = await prisma.message.findMany({
						where: { channelId: BigInt(channelId) },
						include: include,
						...(omit && { omit: omit }),
						cursor: cursor ? { id: BigInt(cursor) } : undefined,
						skip: direction === "none" ? undefined : 1,
						take: (direction === "forward" ? 1 : -1) * limit,
					});

					assertObj("getMessages", messages, DBErrorType.NULL_MESSAGE);
					return messages as MessagePayload<Include, Omit>[];
				} catch (e) {
					console.log("HIII?");
					await assertExists(e, "getMessages", DBErrorType.NULL_CHANNEL, [channelId]);
					throw e;
				}
			},
			async createDefaultMessage<Include extends MessageInclude, Omit extends MessageOmit>(
				authorId: Snowflake,
				channelId: Snowflake,
				type: MessageType,
				content?: string,
				attachments?: string[],
				embeds?: APIEmbed[],
				mentions?: Snowflake[],
				flags?: number,
				include?: Include,
				omit?: Omit,
			) {
				try {
					const createdEmbeds: Embed[] = [];

					if (embeds) {
						for (const embed of embeds) {
							createdEmbeds.push(await prisma.embed.createEmbed(embed.title, embed.description, embed.url, embed.type, embed.thumbnail));
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
						include: include,
						...(omit && { omit: omit }),
					});

					console.log(message);

					await prisma.channel.update({ where: { id: BigInt(channelId) }, data: { lastMessageId: message.id } });

					assertObj("createDefaultMessage", message, DBErrorType.NULL_MESSAGE);
					return message as MessagePayload<Include, Omit>;
				} catch (e) {
					await assertExists(e, "createDefaultMessage", DBErrorType.NULL_CHANNEL, [channelId]);
					await assertExists(e, "createDefaultMessage", DBErrorType.NULL_USER, [authorId]);
					throw e;
				}
			},
		},
	},
});

export default messagesExtension;
