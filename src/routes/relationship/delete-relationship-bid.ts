import { DBErrorType, prisma } from "@/src/db";
import { createError } from "@/src/factory/error-factory";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@shared/errors";
import { GatewayDispatchEvents, GatewayRelationshipDeleteDispatch } from "@shared/gateway-types";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const payload = getJwt(c);
         const userId = c.req.param("userId");

         await prisma.relationship.deleteByUserId(payload.id, userId);

         dispatchToTopic<GatewayRelationshipDeleteDispatch>(payload.id, GatewayDispatchEvents.RELATIONSHIP_DELETE, userId, 0);
         dispatchToTopic<GatewayRelationshipDeleteDispatch>(userId, GatewayDispatchEvents.RELATIONSHIP_DELETE, payload.id, 0);

         return c.newResponse(null, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
            return error(c, createError(Error.unknownRelationship()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
