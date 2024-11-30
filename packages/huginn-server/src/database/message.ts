import type { Snowflake } from "@huginn/shared";
import { WorkerID, snowflake } from "@huginn/shared";
import type { MessageType } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { DBErrorType, assertCondition, assertId, assertObj, prisma } from ".";
import type { MessageInclude, MessageOmit, MessagePayload } from "./common";

const messagesExtention = Prisma.defineExtension({
	model: {
		message: {
			async getById<Include extends MessageInclude, Omit extends MessageOmit>(
				channelId: Snowflake,
				messageId: Snowflake,
				include?: Include,
				omit?: Omit,
			) {
				assertId("getById", channelId, messageId);
				await prisma.channel.assertChannelExists("getById", channelId);

				const message = await prisma.message.findUnique({
					where: { channelId: BigInt(channelId), id: BigInt(messageId) },
					include: include,
					...(omit && { omit: omit }),
				});

				assertObj("getById", message, DBErrorType.NULL_MESSAGE, messageId);
				return message as MessagePayload<Include, Omit>;
			},
			async getMessages<Include extends MessageInclude, Omit extends MessageOmit>(
				channelId: Snowflake,
				limit: number,
				before?: Snowflake,
				after?: Snowflake,
				include?: Include,
				omit?: Omit,
			) {
				await prisma.channel.assertChannelExists("getMessages", channelId);

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
			},
			async createDefaultMessage<Include extends MessageInclude, Omit extends MessageOmit>(
				authorId: Snowflake,
				channelId: Snowflake,
				type: MessageType,
				content?: string,
				attachments?: string[],
				mentions?: Snowflake[],
				flags?: number,
				include?: Include,
				omit?: Omit,
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
					...(omit && { omit: omit }),
				});

				await prisma.channel.update({ where: { id: BigInt(channelId) }, data: { lastMessageId: message.id } });

				assertObj("createDefaultMessage", message, DBErrorType.NULL_MESSAGE);
				return message as MessagePayload<Include, Omit>;
			},
			async assertMessageExists(methodName: string, messageId: Snowflake) {
				assertId(methodName, messageId);
				const messageExists = await prisma.message.exists({ id: BigInt(messageId) });
				assertCondition(methodName, !messageExists, DBErrorType.NULL_MESSAGE, messageId);
			},
		},
	},
});

export default messagesExtention;
