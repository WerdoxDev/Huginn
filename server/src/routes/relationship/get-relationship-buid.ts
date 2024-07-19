import { prisma } from "@/src/db";
import { includeRelationshipUser } from "@/src/db/common";
import { getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserRelationshipByIdResult } from "@shared/api-types";
import { HttpCode } from "@shared/errors";
import { idFix, omit } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(c, async () => {
      const payload = getJwt(c);
      const userId = c.req.param("userId");

      const relationship: APIGetUserRelationshipByIdResult = idFix(
         omit(await prisma.relationship.getByUserId(payload.id, userId, includeRelationshipUser), ["ownerId", "userId"])
      );

      return c.json(relationship, HttpCode.OK);
   })
);

export default app;
