import { APIPostRefreshTokenJSONBody, APIPostRefreshTokenResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { REFRESH_TOKEN_SECRET, createTokens, verifyToken } from "../../factory/token-factory";
import { HttpCode } from "@shared/errors";
import { constants } from "@shared/constants";
import { logServerError } from "../../log-utils";
import { InferContext } from "../../..";

const route = new Elysia();

route.post("/refresh-token", (ctx) => handleRefreshToken(ctx), {
   body: t.Object({
      refreshToken: t.String(),
   }),
});

async function handleRefreshToken(ctx: InferContext<typeof route, APIPostRefreshTokenJSONBody>) {
   try {
      const [isValid, payload] = await verifyToken(ctx.body.refreshToken, REFRESH_TOKEN_SECRET);

      if (!isValid || !payload) {
         ctx.set.status = HttpCode.UNAUTHORIZED;
         return undefined;
      }

      const [accessToken, refreshToken] = await createTokens(
         { id: payload.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const result: APIPostRefreshTokenResult = { token: accessToken, refreshToken };

      ctx.set.status = HttpCode.OK;
      return result;
   } catch (e) {
      logServerError(ctx.path, e);

      ctx.set.status = HttpCode.SERVER_ERROR;
      return undefined;
   }
}

export default route;
