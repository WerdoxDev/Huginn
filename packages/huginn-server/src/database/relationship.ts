import { DBErrorType } from "@huginn/backend-shared/types";
import { RelationshipType, type Snowflake, WorkerID, snowflake } from "@huginn/shared";
import { Prisma } from "@prisma/client";
import { assertCondition, assertExists, assertId, assertObj, prisma } from ".";

export const relationshipExtension = Prisma.defineExtension({
	model: {
		relationship: {
			async getByUserId<Args extends Prisma.RelationshipDefaultArgs>(ownerId: Snowflake, userId: Snowflake, args?: Args) {
				assertId("getByUserId", ownerId, userId);

				const relationship = await prisma.relationship.findFirst({
					where: { ownerId: BigInt(ownerId), userId: BigInt(userId) },
					...args,
				});

				assertObj("getById", relationship, DBErrorType.NULL_RELATIONSHIP, `${ownerId}, ${userId}`);
				return relationship as Prisma.RelationshipGetPayload<Args>;
			},
			async getUserRelationships<Args extends Prisma.RelationshipDefaultArgs>(userId: Snowflake, args?: Args) {
				try {
					const relationships = await prisma.relationship.findMany({
						where: { ownerId: BigInt(userId) },
						...args,
					});

					assertObj("getUserRelationships", relationships, DBErrorType.NULL_RELATIONSHIP);
					return relationships as Prisma.RelationshipGetPayload<Args>[];
				} catch (e) {
					await assertExists(e, "getUserRelationships", DBErrorType.NULL_USER, [userId]);
					throw e;
				}
			},
			async deleteByUserId(ownerId: Snowflake, userId: Snowflake) {
				assertId("deleteByUserId", ownerId, userId);

				const relation = await prisma.relationship.findFirst({ where: { userId: BigInt(userId), ownerId: BigInt(ownerId) } });
				assertObj("deleteByUserId", relation, DBErrorType.NULL_RELATIONSHIP, `${ownerId}>${userId}`);

				const oppositeRelation = await prisma.relationship.findFirst({
					where: { userId: BigInt(ownerId), ownerId: BigInt(userId) },
				});
				assertObj("deleteByUserId", oppositeRelation, DBErrorType.NULL_RELATIONSHIP, `${userId}>${ownerId}`);

				const deleteRelation = prisma.relationship.delete({ where: { id: relation?.id } });
				const deleteOppositeRelation = prisma.relationship.delete({ where: { id: oppositeRelation?.id } });

				await prisma.$transaction([deleteRelation, deleteOppositeRelation]);
			},
			async createRelationship<Args extends Prisma.RelationshipDefaultArgs>(senderId: string, recieverId: string, args?: Args) {
				try {
					const incomingExists = await prisma.relationship.exists({
						ownerId: BigInt(senderId),
						userId: BigInt(recieverId),
						type: RelationshipType.PENDING_INCOMING,
					});

					if (incomingExists) {
						await prisma.relationship.updateMany({
							where: {
								OR: [
									{ ownerId: BigInt(senderId), userId: BigInt(recieverId) },
									{ ownerId: BigInt(recieverId), userId: BigInt(senderId) },
								],
							},
							data: { type: RelationshipType.FRIEND, since: new Date() },
						});

						const relationships = await prisma.relationship.findMany({
							where: {
								OR: [
									{ ownerId: BigInt(senderId), userId: BigInt(recieverId) },
									{ ownerId: BigInt(recieverId), userId: BigInt(senderId) },
								],
							},
							...args,
						});

						return relationships as Prisma.RelationshipGetPayload<Args>[];
					}

					const relationships = await prisma.relationship.createManyAndReturn({
						data: [
							{
								id: snowflake.generate(WorkerID.RELATIONSHIP),
								nickname: "",
								type: RelationshipType.PENDING_INCOMING,
								ownerId: BigInt(recieverId),
								userId: BigInt(senderId),
								since: null,
							},
							{
								id: snowflake.generate(WorkerID.RELATIONSHIP),
								nickname: "",
								type: RelationshipType.PENDING_OUTGOING,
								ownerId: BigInt(senderId),
								userId: BigInt(recieverId),
								since: null,
							},
						],
						...args,
					});

					assertObj("createRelationship", relationships, DBErrorType.NULL_RELATIONSHIP);

					return relationships as Prisma.RelationshipGetPayload<Args>[];
				} catch (e) {
					await assertExists(e, "createRelationship", DBErrorType.NULL_USER, [senderId, recieverId]);
					throw e;
				}
			},
		},
	},
});
