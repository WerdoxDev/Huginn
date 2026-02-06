import { createToken, unauthorized, verifyToken } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { constants, type APIPostRefreshTokenResult } from "@huginn/shared";
import Elysia, { t } from "elysia";

const schema = t.Object({ refreshToken: t.String() });

export const postRefreshToken = new Elysia().post(
   "/api/auth/refresh-token",
   async ({ body, status }) => {
      const { valid, payload } = await verifyToken("user-refresh", body.refreshToken);

      if (!valid || !payload) {
         return unauthorized(status);
      }

      const user = await prisma.user.getById(payload.id, { select: { id: true } });

      const accessToken = await createToken("user-access", { id: user.id, authType: payload.authType }, constants.ACCESS_TOKEN_EXPIRE_TIME);
      const refreshToken = await createToken("user-refresh", { id: user.id, authType: payload.authType }, constants.REFRESH_TOKEN_EXPIRE_TIME);

      const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
      return status("OK", json);
   },
   { body: schema },
);
