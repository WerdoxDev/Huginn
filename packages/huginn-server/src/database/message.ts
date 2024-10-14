import type { Snowflake } from "@huginn/shared";
import { WorkerID, snowflake } from "@huginn/shared";
import type { MessageType } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertId, assertObj, prisma } from ".";
import type { MessageInclude, MessagePayload } from "./common";

const messagesExtention = Prisma.defineExtension({
	model: {
		message: {
			async getById<Include extends MessageInclude>(channelId: Snowflake, messageId: Snowflake, include?: Include) {
				assertId("getById", channelId, messageId);
				await prisma.channel.assertChannelExists("getById", channelId);

				const message = await prisma.message.findUnique({
					where: { channelId: BigInt(channelId), id: BigInt(messageId) },
					include: include,
				});

				assertObj("getById", message, DBErrorType.NULL_MESSAGE, messageId);
				return message as MessagePayload<Include>;
			},
			async getMessages<Include extends MessageInclude>(
				channelId: Snowflake,
				limit: number,
				before?: Snowflake,
				after?: Snowflake,
				include?: Include,
			) {
				await prisma.channel.assertChannelExists("getMessages", channelId);

				const cursor = after ?? before;
				const direction = after ? "forward" : before ? "backward" : "none";

				const messages = await prisma.message.findMany({
					where: { channelId: BigInt(channelId) },
					include: include,
					cursor: cursor ? { id: BigInt(cursor) } : undefined,
					skip: direction === "none" ? undefined : 1,
					take: (direction === "forward" ? 1 : -1) * limit,
				});

				assertObj("getMessages", messages, DBErrorType.NULL_MESSAGE);
				return messages as MessagePayload<Include>[];
			},
			async createDefaultMessage<Include extends MessageInclude>(
				authorId: Snowflake,
				channelId: Snowflake,
				type: MessageType,
				content?: string,
				attachments?: string[],
				mentions?: Snowflake[],
				flags?: number,
				include?: Include,
			) {
				await prisma.user.assertUserExists("createDefaultMessage", authorId);
				await prisma.channel.assertChannelExists("createDefaultMessage", channelId);

				const message = await prisma.message.create({
					data: {
						id: snowflake.generate(WorkerID.MESSAGE),
						type: type,
						channelId: BigInt(channelId),
						content: content ?? "",
						attachments: attachments,
						mentions: { connect: mentions?.map((x) => ({ id: BigInt(x) })) },
						authorId: BigInt(authorId),
						createdAt: new Date(),
						editedAt: null,
						pinned: false,
						reactions: [],
						flags: flags,
					},
					include: include,
				});

				await prisma.channel.update({ where: { id: BigInt(channelId) }, data: { lastMessageId: message.id } });

				assertObj("createDefaultMessage", message, DBErrorType.NULL_MESSAGE);
				return message as MessagePayload<Include>;
			},
		},
	},
});

export default messagesExtention;
