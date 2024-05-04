import { prisma } from "@/src/database";
import { includeRelationshipUser } from "@/src/database/database-common";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { HttpCode } from "@shared/errors";
import { omitArray } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const relationships = omitArray(await prisma.relationship.getUserRelationships(payload.id, includeRelationshipUser), [
         "ownerId",
         "userId",
      ]);

      return c.json(relationships, HttpCode.OK);
   })
);

export default app;
