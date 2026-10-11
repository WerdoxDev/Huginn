import { unauthorized, verifyToken } from "@huginn/backend-shared";
import { type APIPostRefreshTokenResult } from "@huginnjs/shared";
import Elysia, { t } from "elysia";

import { rotateAuthSession } from "#utils/auth-session";

const schema = t.Object({ refreshToken: t.String() });

export const postRefreshToken = new Elysia().post(
   "/api/auth/refresh-token",
   async ({ body, status }) => {
      const { valid, payload } = await verifyToken("user-refresh", body.refreshToken);

      if (!valid || !payload?.sessionId || !payload.tokenId) {
         return unauthorized(status);
      }
      const tokens = await rotateAuthSession(payload.sessionId, payload.id, body.refreshToken, payload.authType, payload.lastAuthenticatedAt);
      if (!tokens) return unauthorized(status);
      const json: APIPostRefreshTokenResult = tokens;
      return status("OK", json);
   },
   { body: schema },
);
