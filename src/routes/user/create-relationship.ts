import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, hValidator, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIPostCreateRelationship, RelationshipType } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ username: z.string() });

const app = new Hono();

app.post("/user/@me/relationships", verifyJwt(), hValidator("json", schema), c =>
   handleRequest(
      c,
      async () => {
         const body = (await c.req.json()) as APIPostCreateRelationship;
         const payload = getJwt(c);

         if (!body.username) {
            return error(c, createError(Error.invalidFormBody()));
         }

         const user = await prisma.user.getByUsername(body.username);

         if (user.id === payload.id) {
            return error(c, createError(Error.relationSelfRequest()), HttpCode.BAD_REQUEST);
         }

         // Outgoing
         await prisma.relationship.createRelationship(payload.id, user.id, RelationshipType.PENDING_OUTGOING);

         // Incoming
         await prisma.relationship.createRelationship(user.id, payload.id, RelationshipType.PENDING_INCOMING);

         return c.newResponse(null, HttpCode.NO_CONTENT);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.noUserWithUsername()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
