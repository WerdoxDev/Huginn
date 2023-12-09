import { APIPostRefreshTokenJSONBody, APIPostRefreshTokenResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { REFRESH_TOKEN_SECRET, createTokens, verifyToken } from "../../factory/token-factory";
import { constants } from "@shared/constants";
import { InferContext } from "../../..";
import { logAndReturnError, returnResult } from "../../route-utils";

const route = new Elysia();

route.post("/refresh-token", (ctx) => handleRefreshToken(ctx), {
   body: t.Object({
      refreshToken: t.String(),
   }),
});

async function handleRefreshToken(ctx: InferContext<typeof route, APIPostRefreshTokenJSONBody>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.body.refreshToken, REFRESH_TOKEN_SECRET);

      const [accessToken, refreshToken] = await createTokens(
         { id: payload!.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const result: APIPostRefreshTokenResult = { token: accessToken, refreshToken };

      return returnResult(ctx, result);
   } catch (e) {
      return logAndReturnError(ctx, e);
   }
}

export default route;
