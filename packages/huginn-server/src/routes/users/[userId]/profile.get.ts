import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPublicUser } from "@huginn/backend-shared/database/common";
import { type APIGetProfileResult, type APIPublicUser } from "@huginnjs/shared";
import Elysia from "elysia";

import { getUserBadges } from "#utils/route-utils";

export const getUserProfile = new Elysia().use(verifyJwt()).get("/api/users/:userId/profile", async ({ params: { userId }, status }) => {
   const user: APIPublicUser = await prisma.user.getById(userId, { select: selectPublicUser });

   const badges = await getUserBadges(userId);
   const json: APIGetProfileResult = { user, badges };
   return status("OK", json);
});
