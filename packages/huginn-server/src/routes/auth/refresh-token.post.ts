import { createRoute, createToken, validator, verifyToken } from "@huginn/backend-shared";
import { unauthorized } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { constants, type APIPostRefreshTokenResult, HttpCode } from "@huginn/shared";
import { z } from "zod";

const schema = z.object({ refreshToken: z.string() });

createRoute("POST", "/api/auth/refresh-token", validator("json", schema), async (c) => {
   const body = c.req.valid("json");

   const { valid, payload } = await verifyToken("user-refresh", body.refreshToken);

   if (!valid || !payload) {
      return unauthorized(c);
   }

   const user = await prisma.user.getById(payload.id, { select: { id: true } });

   const accessToken = await createToken(
      "user-access",
      { id: user.id, isOAuth: await prisma.identityProvider.exists({ userId: BigInt(user.id) }) },
      constants.ACCESS_TOKEN_EXPIRE_TIME,
   );
   const refreshToken = await createToken("user-refresh", { id: user.id }, constants.REFRESH_TOKEN_EXPIRE_TIME);

   const json: APIPostRefreshTokenResult = { token: accessToken, refreshToken };
   return c.json(json, HttpCode.OK);
});
