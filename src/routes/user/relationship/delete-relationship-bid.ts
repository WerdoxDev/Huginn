import { DBErrorType, prisma } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, getJwt, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.delete("/users/@me/relationships/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const payload = getJwt(c);
         await prisma.relationship.deleteByUserId(payload.id, c.req.param("userId"));

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
