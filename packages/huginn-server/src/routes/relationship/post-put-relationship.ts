import { DBErrorType, prisma } from "@/db";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getJwt, hValidator, handleRequest, verifyJwt } from "@/route-utils";
import { createError, errorResponse } from "@huginn/backend-shared";
import { omit, omitArray, RelationshipType } from "@huginn/shared";
import { Error, HttpCode } from "@huginn/shared";
import { GatewayRelationshipCreateDispatch } from "@huginn/shared";
import { Snowflake } from "@huginn/shared";
import { idFix } from "@huginn/shared";
import { Context, Hono } from "hono";
import { z } from "zod";

const schema = z.object({ username: z.string() });

const app = new Hono();

async function requestRest(c: Context, userId: Snowflake) {
   const payload = getJwt(c);

   if (userId === payload.id) {
      return errorResponse(c, createError(Error.relationshipSelfRequest()), HttpCode.BAD_REQUEST);
   }

   if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
      return errorResponse(c, createError(Error.relationshipExists()), HttpCode.BAD_REQUEST);
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

      const relationshipOwner = relationships.find(x => x.ownerId === payload.id)!;
      const relationshipUser = relationships.find(x => x.ownerId === userId)!;

      dispatchToTopic<GatewayRelationshipCreateDispatch>(payload.id, "relationship_create", relationshipOwner, 0);
      dispatchToTopic<GatewayRelationshipCreateDispatch>(userId, "relationship_create", relationshipUser, 0);
   }

   return c.newResponse(null, HttpCode.NO_CONTENT);
}

app.post("/users/@me/relationships", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = c.req.valid("json");

         if (!body.username) {
            return errorResponse(c, createError(Error.invalidFormBody()));
         }

         const userId = idFix(await prisma.user.getByUsername(body.username)).id;

         return requestRest(c, userId);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return errorResponse(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      },
   ),
);
app.put("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const userId = c.req.param("userId");

         return requestRest(c, userId);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return errorResponse(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
