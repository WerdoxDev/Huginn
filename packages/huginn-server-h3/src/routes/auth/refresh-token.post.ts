import { unauthorized } from "@huginn/backend-shared";
import { APIPostRefreshTokenResult, constants, HttpCode } from "@huginn/shared";
import { z } from "zod";

const schema = z.object({ refreshToken: z.string() });

export default defineEventHandler(async () => {
   const body = await useValidatedBody(schema);

   const { valid, payload } = await verifyToken(body.refreshToken, REFRESH_TOKEN_SECRET_ENCODED);

   if (!valid || !payload) {
      throw unauthorized(useEvent());
   }

   const [accessToken, refreshToken] = await createTokens(
      { id: payload?.id },
      constants.ACCESS_TOKEN_EXPIRE_TIME,
      constants.REFRESH_TOKEN_EXPIRE_TIME,
   );

   const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
   setResponseStatus(useEvent(), HttpCode.OK);
   return json;
});
