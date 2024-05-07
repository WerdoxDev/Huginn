import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { publishToTopic } from "@/src/gateway/gateway-utils";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@shared/errors";
import { GatewayDispatchEvents, GatewayOperations, GatewayRelationshipDeleteDispatch } from "@shared/gateway-types";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const payload = getJwt(c);
         const userId = c.req.param("userId");
         await prisma.relationship.deleteByUserId(payload.id, userId);

         const data: GatewayRelationshipDeleteDispatch = {
            op: GatewayOperations.DISPATCH,
            t: GatewayDispatchEvents.RELATIONSHIP_DELETE,
            d: "",
            s: 0,
         };

         publishToTopic(payload.id, { ...data, d: userId });
         publishToTopic(userId, { ...data, d: payload.id });

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
