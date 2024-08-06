import { prisma } from "@/db";
import { includeRelationshipUser } from "@/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/route-utils";
import { APIGetUserRelationshipByIdResult, HttpCode, idFix, omit } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const userId = c.req.param("userId");

      const relationship: APIGetUserRelationshipByIdResult = idFix(
         omit(await prisma.relationship.getByUserId(payload.id, userId, includeRelationshipUser), ["ownerId", "userId"]),
      );

      return c.json(relationship, HttpCode.OK);
   }),
);

export default app;
