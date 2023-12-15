import { DBErrorType, DatabaseUser } from "@/src/database";
import { createError } from "@/src/factory/error-factory";
import { error, handleRequest, verifyJwt } from "@/src/route-utils";
import { Error, Field, HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.get("/users/:userId", verifyJwt(), c =>
   handleRequest(
      c,
      async () => {
         const user = await DatabaseUser.getUserById(c.req.param("userId"), "-email");

         return c.json(user.toObject(), HttpCode.OK);
      },
      e => {
         if (e.isErrorType(DBErrorType.NULL_USER)) {
            return error(c, createError(Error.unknownUser()).error(e.error.cause, Field.invalidUserId()), HttpCode.NOT_FOUND);
         }
      },
   ),
);

export default app;
