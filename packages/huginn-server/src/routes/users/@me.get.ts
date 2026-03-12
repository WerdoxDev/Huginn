import { verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectPrivateUser } from "@huginn/backend-shared/database/common";
import { type APIGetCurrentUserResult } from "@huginn/shared";
import Elysia from "elysia";

export const getMe = new Elysia().use(verifyJwt()).get("/api/users/@me", async ({ tokenPayload, status }) => {
   const user: APIGetCurrentUserResult = await prisma.user.getById(tokenPayload.id, {
      select: selectPrivateUser,
   });

   return status("OK", user);
});
