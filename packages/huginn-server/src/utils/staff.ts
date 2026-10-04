import { forbidden, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { UserFlags, type APIPublicUser } from "@huginnjs/shared";
import Elysia from "elysia";

export function verifyStaff() {
   return new Elysia({ name: "verify-staff" })
      .use(verifyJwt("user-access"))
      .as("scoped")
      .derive({ as: "scoped" }, async ({ tokenPayload, status }) => {
         if (!tokenPayload) return forbidden(status);

         const user = await prisma.user.getById(tokenPayload.id, {
            select: { id: true, username: true, displayName: true, avatar: true, flags: true },
         });

         if ((user.flags & UserFlags.STAFF) !== UserFlags.STAFF) {
            return forbidden(status);
         }

         return { staffUser: user as APIPublicUser };
      });
}
