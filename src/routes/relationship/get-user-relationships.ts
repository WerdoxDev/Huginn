import { prisma } from "@/src/db";
import { includeRelationshipUser } from "@/src/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserRelationshipsResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix, omitArray } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const relationships: APIGetUserRelationshipsResult = omitArray(
         idFix(await prisma.relationship.getUserRelationships(payload.id, includeRelationshipUser)),
         ["ownerId", "userId"]
      );

      return c.json(relationships, HttpCode.OK);
   })
);

export default app;
