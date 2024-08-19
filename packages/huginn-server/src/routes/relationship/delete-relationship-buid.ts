import { prisma } from "@/db";
import { dispatchToTopic } from "@/gateway/gateway-utils";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const userId = c.req.param("userId");

      await prisma.relationship.deleteByUserId(payload.id, userId);

      dispatchToTopic(payload.id, "relationship_delete", userId);
      dispatchToTopic(userId, "relationship_delete", payload.id);

      return c.newResponse(null, HttpCode.OK);
   }),
);

export default app;
