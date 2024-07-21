import { getRawToken, handleRequest, verifyJwt } from "@/route-utils";
import { tokenInvalidator } from "@/server";
import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";

const app = new Hono();

app.post("/auth/logout", verifyJwt(), c =>
   handleRequest(c, () => {
      const token = getRawToken(c);

      tokenInvalidator.invalidate(token);

      return c.newResponse(null, HttpCode.NO_CONTENT);
   }),
);

export default app;
