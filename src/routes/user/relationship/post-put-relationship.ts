import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIPostCreateRelationshipJSONBody, RelationshipType } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { GatewayDispatchEvents } from "@shared/gateway-types";
import consola from "consola";
import { Hono } from "hono";
import { createFactory } from "hono/factory";
import { z } from "zod";

const schema = z.object({ username: z.string() });

const app = new Hono();

const requestHandler = createFactory().createHandlers(c =>
   handleRequest(
      c,
      async () => {
         const potentialBody = c.req.method === "POST" ? ((await c.req.json()) as APIPostCreateRelationshipJSONBody) : null;
         const payload = getJwt(c);

         let userId = c.req.param("userId");

         if (potentialBody) {
            if (!potentialBody.username) {
               return error(c, createError(Error.invalidFormBody()));
            }

            userId = (await prisma.user.getByUsername(potentialBody.username)).id;
         }

         if (userId === payload.id) {
            return error(c, createError(Error.relationshipSelfRequest()), HttpCode.BAD_REQUEST);
         }

         if (await prisma.relationship.exists({ ownerId: payload.id, userId: userId, type: RelationshipType.FRIEND })) {
            return error(c, createError(Error.relationshipExists()), HttpCode.BAD_REQUEST);
         }

         if (!(await prisma.relationship.exists({ ownerId: payload.id, userId: userId, type: RelationshipType.PENDING_OUTGOING }))) {
            const relationships = await prisma.relationship.createRelationship(payload.id, userId, { user: true });

            consola.log(relationships);

            dispatchToTopic(
               payload.id,
               GatewayDispatchEvents.RELATIONSHIP_CREATE,
               relationships.find(x => x.ownerId === payload.id),
               0
            );
            dispatchToTopic(
               userId,
               GatewayDispatchEvents.RELATIONSHIP_CREATE,
               relationships.find(x => x.ownerId === userId),
               0
            );
         }

         return c.newResponse(null, HttpCode.NO_CONTENT);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      }
   )
);

app.post("/users/@me/relationships", verifyJwt(), hValidator("json", schema), ...requestHandler);
app.put("/users/@me/relationships/:userId", verifyJwt(), ...requestHandler);

export default app;
