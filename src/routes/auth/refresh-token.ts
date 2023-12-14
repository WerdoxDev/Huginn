import { APIPostRefreshTokenJSONBody, APIPostRefreshTokenResult } from "@shared/api-types";
import Elysia, { t } from "elysia";
import { constants } from "@shared/constants";
import { InferContext } from "@/index";
import { verifyToken, REFRESH_TOKEN_SECRET, createTokens } from "@/src/factory/token-factory";
import { setup, result, serverError } from "@/src/route-utils";

const route = new Elysia().post("/auth/refresh-token", (ctx) => handleRefreshToken(ctx), {
   body: t.Object({
      refreshToken: t.String(),
   }),
});

async function handleRefreshToken(ctx: InferContext<typeof setup, APIPostRefreshTokenJSONBody>) {
   try {
      const [_isValid, payload] = await verifyToken(ctx.body.refreshToken, REFRESH_TOKEN_SECRET);

      const [accessToken, refreshToken] = await createTokens(
         { id: payload!.id },
         constants.ACCESS_TOKEN_EXPIRE_TIME,
         constants.REFRESH_TOKEN_EXPIRE_TIME,
      );

      const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };

      return result(ctx, json);
   } catch (e) {
      return serverError(ctx, e);
   }
}

export default route;
