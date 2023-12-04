import { APIPostRefreshTokenJSONBody, APIPostRefreshTokenResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { REFRESH_TOKEN_SECRET, createTokens, verifyToken } from "../../factory/token-factory";
import { createError } from "../../factory/error-factory";
import { HttpCode } from "@shared/errors";
import { constants } from "@shared/constants";
import { createResult } from "../../factory/result-factory";

const route = new Elysia();

route.post("/refresh-token", ({ body }) => handleRefreshToken(body), {
   body: t.Object({
      refreshToken: t.String(),
   }),
});

async function handleRefreshToken(body: APIPostRefreshTokenJSONBody): Promise<Response> {
   try {
      const [isValid, payload] = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET);

      if (!isValid || !payload) {
         return createError().toResponse(HttpCode.UNAUTHORIZED);
      }

      const [accessToken, refreshToken] = await createTokens(
         { id: payload.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME
      );

      const result: APIPostRefreshTokenResult = { token: accessToken, refreshToken };

      return createResult(result, HttpCode.OK);
   } catch (e) {
      return createError().toResponse(HttpCode.SERVER_ERROR);
   }
}

export default route;
