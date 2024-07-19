import { REFRESH_TOKEN_SECRET_ENCODED, createTokens, verifyToken } from "@/src/factory/token-factory";
import { hValidator, handleRequest } from "@/src/route-utils";
import { APIPostRefreshTokenResult } from "@huginn/shared";
import { constants } from "@huginn/shared";
import { HttpCode } from "@huginn/shared";
import { Hono } from "hono";
import { z } from "zod";

const schema = z.object({ refreshToken: z.string() });

const app = new Hono();

app.post("/auth/refresh-token", hValidator("json", schema), c =>
   handleRequest(c, async () => {
      const body = c.req.valid("json");

      const { payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);

      const [accessToken, refreshToken] = await createTokens(
         { id: payload?.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };

      return c.json(json, HttpCode.OK);
   }),
);

export default app;
