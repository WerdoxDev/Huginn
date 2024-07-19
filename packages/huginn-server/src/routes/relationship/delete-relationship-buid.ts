import { prisma } from "@/src/db";
import { dispatchToTopic } from "@/src/gateway/gateway-utils";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { HttpCode } from "@huginn/shared";
import { GatewayRelationshipDeleteDispatch } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const userId = c.req.param("userId");

      await prisma.relationship.deleteByUserId(payload.id, userId);

      dispatchToTopic<GatewayRelationshipDeleteDispatch>(payload.id, "relationship_delete", userId, 0);
      dispatchToTopic<GatewayRelationshipDeleteDispatch>(userId, "relationship_delete", payload.id, 0);

      return c.newResponse(null, HttpCode.OK);
   }),
);

export default app;
