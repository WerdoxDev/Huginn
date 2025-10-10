import { verifyJwt2 } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { omitRelationshipUserIds, selectRelationshipUser } from "@huginn/backend-shared/database/common";
import { type APIGetUserRelationshipByIdResult } from "@huginn/shared";
import Elysia from "elysia";

export const getUserRelationship = new Elysia()
   .use(verifyJwt2())
   .get("/api/users/@me/relationships/:userId", async ({ tokenPayload, status, params: { userId } }) => {
      const relationship: APIGetUserRelationshipByIdResult = await prisma.relationship.getByUserId(tokenPayload.id, userId, {
         include: selectRelationshipUser,
         omit: omitRelationshipUserIds,
      });

      return status("OK", relationship);
   });
