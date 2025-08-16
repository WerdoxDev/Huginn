import { createRoute } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPublicUser } from "@huginn/backend-shared/database/common";
import { type APIPublicUser, HttpCode } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("GET", "/api/users/:userId", verifyJwt(), async (c) => {
   const { userId } = c.req.param();

   const user: APIPublicUser = await prisma.user.getById(userId, { select: selectPublicUser });

   return c.json(user, HttpCode.OK);
});
