import { verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitRelationshipUserIds, selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { type APIGetUserRelationshipsResult } from "@huginn/shared";
import Elysia from "elysia";

export const getUserRelationships = new Elysia().use(verifyJwt2()).get("/api/users/@me/relationships", async ({ tokenPayload, status }) => {
   const relationships: APIGetUserRelationshipsResult = await prisma.relationship.getUserRelationships(tokenPayload.id, {
      include: selectRelationshipUser,
      omit: omitRelationshipUserIds,
   });

   return status("OK", relationships);
});
