import { router } from "@/server";
import { assertError, DBErrorType, prisma } from "@database";
import { catchError, createErrorFactory, createHuginnError, useValidatedBody } from "@huginn/backend-shared";
import { Errors, HttpCode, idFix, omitArray, RelationshipType, Snowflake } from "@huginn/shared";
import { dispatchToTopic } from "@utils/gateway-utils";
import { useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, H3Event, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ username: z.string() });

router.post(
   "/users/@me/relationships",
   defineEventHandler(async event => {
      const body = await useValidatedBody(event, schema);

      if (!body.username) {
         return createHuginnError(event, createErrorFactory(Errors.invalidFormBody()));
      }

      const [error, userId] = await catchError(async () => idFix(await prisma.user.getByUsername(body.username)).id);

      if (assertError(error, DBErrorType.NULL_USER)) {
         return createHuginnError(event, createErrorFactory(Errors.noUserWithUsername()), HttpCode.NOT_FOUND);
      } else if (error) throw error;

      return relationshipPost(event, userId);
   }),
);

export async function relationshipPost(event: H3Event, userId: Snowflake) {
   const { payload } = await useVerifiedJwt(event);

   if (userId === payload.id) {
      return createHuginnError(event, createErrorFactory(Errors.relationshipSelfRequest()), HttpCode.BAD_REQUEST);
   }

   if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
      return createHuginnError(event, createErrorFactory(Errors.relationshipExists()), HttpCode.BAD_REQUEST);
   }

   if (
      !(await prisma.relationship.exists({
         ownerId: BigInt(payload.id),
         userId: BigInt(userId),
         type: RelationshipType.PENDING_OUTGOING,
      }))
   ) {
      const relationships = omitArray(idFix(await prisma.relationship.createRelationship(payload.id, userId, { user: true })), [
         "userId",
      ]);

      const relationshipOwner = relationships.find(x => x.ownerId === payload.id);
      const relationshipUser = relationships.find(x => x.ownerId === userId);

      if (relationshipOwner && relationshipUser) {
         dispatchToTopic(payload.id, "relationship_create", relationshipOwner);
         dispatchToTopic(userId, "relationship_create", relationshipUser);
      }
   }

   setResponseStatus(event, HttpCode.NO_CONTENT);
   return null;
}
