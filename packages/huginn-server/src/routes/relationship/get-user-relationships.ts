import { prisma } from "@/db";
import { includeRelationshipUser } from "@/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { APIGetUserRelationshipsResult, HttpCode, idFix, omitArray } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);

      const relationships: APIGetUserRelationshipsResult = omitArray(
         idFix(await prisma.relationship.getUserRelationships(payload.id, includeRelationshipUser)),
         ["ownerId", "userId"],
      );

      return c.json(relationships, HttpCode.OK);
   }),
);

export default app;
