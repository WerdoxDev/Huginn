import { createRoute, verifyJwt } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitRelationshipUserIds, selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { type APIGetUserRelationshipsResult, HttpCode } from "@huginn/shared";
createRoute("GET", "/api/users/@me/relationships", verifyJwt(), async (c) => {
   const payload = c.get("tokenPayload");

   const relationships: APIGetUserRelationshipsResult = await prisma.relationship.getUserRelationships(payload.id, {
      include: selectRelationshipUser,
      omit: omitRelationshipUserIds,
   });

   return c.json(relationships, HttpCode.OK);
});
