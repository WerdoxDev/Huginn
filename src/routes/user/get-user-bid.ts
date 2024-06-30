import { DBErrorType, prisma } from "@/src/db";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { APIGetUserByIdResult } from "@shared/api-types";
import { Error, Field, HttpCode } from "@shared/errors";
import { idFix, omit } from "@shared/utils";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const user: APIGetUserByIdResult = idFix(omit(await prisma.user.getById(c.req.param("userId")), ["email"]));

         return c.json(user, HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
         }
      }
   )
);

export default app;
