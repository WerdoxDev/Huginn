import { DBErrorType, prisma } from "@/src/db";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { RelationshipType } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { GatewayRelationshipCreateDispatch } from "@shared/gateway-types";
import { Snowflake } from "@shared/snowflake";
import { idFix } from "@shared/utils";
import { Context, Hono } from "hono";
import { z } from "zod";

const schema = z.object({ username: z.string() });

const app = new Hono();

async function requestRest(c: Context, userId: Snowflake) {
   const payload = getJwt(c);

   if (userId === payload.id) {
      return error(c, createError(Error.relationshipSelfRequest()), HttpCode.BAD_REQUEST);
   }

   if (await prisma.relationship.exists({ ownerId: BigInt(payload.id), userId: BigInt(userId), type: RelationshipType.FRIEND })) {
      return error(c, createError(Error.relationshipExists()), HttpCode.BAD_REQUEST);
   }

   if (
      !(await prisma.relationship.exists({
         ownerId: BigInt(payload.id),
         userId: BigInt(userId),
         type: RelationshipType.PENDING_OUTGOING,
      }))
   ) {
      const relationships = idFix(await prisma.relationship.createRelationship(payload.id, userId, { user: true }));

      dispatchToTopic<GatewayRelationshipCreateDispatch>(
         payload.id,
         "relationship_create",
         relationships.find(x => x.ownerId === payload.id)!,
         0
      );
      dispatchToTopic<GatewayRelationshipCreateDispatch>(
         userId,
         "relationship_create",
         relationships.find(x => x.ownerId === userId)!,
         0
      );
   }

   return c.newResponse(null, HttpCode.NO_CONTENT);
}

app.post("/users/@me/relationships", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = c.req.valid("json");

         if (!body.username) {
            return error(c, createError(Error.invalidFormBody()));
         }

         const userId = idFix(await prisma.user.getByUsername(body.username)).id;

         return requestRest(c, userId);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      }
   )
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
            return error(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
