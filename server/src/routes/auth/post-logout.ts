import { getRawToken, handleRequest, verifyJwt } from "@/src/route-utils";
import { tokenInvalidator } from "@/src/server";
import { HttpCode } from "@shared/errors";
import { Hono } from "hono";

const app = new Hono();

app.post("/auth/logout", verifyJwt(), c =>
   handleRequest(c, () => {
      const token = getRawToken(c);

      tokenInvalidator.invalidate(token);

      return c.newResponse(null, HttpCode.NO_CONTENT);
   })
);

export default app;
