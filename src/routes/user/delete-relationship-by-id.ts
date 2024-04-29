import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:relationshipId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         await prisma.relationship.deleteById(c.req.param("relationshipId"));

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
