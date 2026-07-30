import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPublicUser } from "@huginn/backend-shared/database/common";
import { type APIPublicUser } from "@huginnjs/shared";
import Elysia from "elysia";

export const getUser = new Elysia().use(verifyJwt()).get("/api/users/:userId", async ({ params: { userId }, status }) => {
   const user: APIPublicUser = await prisma.user.getById(userId, { select: selectPublicUser });

   return status("OK", user);
});
