import { createRoute, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { type APIGetCurrentUserResult, HttpCode } from "@huginn/shared";

createRoute("GET", "/api/users/@me", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");

   const user: APIGetCurrentUserResult = await prisma.user.getById(payload.id, { select: selectPrivateUser });

   return c.json(user, HttpCode.OK);
});
