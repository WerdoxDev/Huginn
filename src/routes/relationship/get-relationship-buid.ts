import { DBErrorType, prisma } from "@/src/database";
import { includeRelationshipUser } from "@/src/database/database-common";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserRelationshipByIdResult } from "@shared/api-types";
import { Error, HttpCode } from "@shared/errors";
import { idFix, omit } from "@shared/utility";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/@me/relationships/:relationshipId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const payload = getJwt(c);
         const relationship: APIGetUserRelationshipByIdResult = idFix(
            omit(await prisma.relationship.getByUserId(payload.id, c.req.param("relationshipId"), includeRelationshipUser), [
               "ownerId",
               "userId",
            ])
         );

         return c.json(relationship, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
            return error(c, createError(Error.unknownRelationship()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
