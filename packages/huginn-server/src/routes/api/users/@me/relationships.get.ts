import { includeRelationshipUser } from "#database/common";
import { router } from "#server";
import { prisma } from "#database";
import { APIGetUserRelationshipsResult, omitArray, idFix, HttpCode } from "@huginn/shared";
import { useVerifiedJwt } from "#utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";

router.get(
   "/users/@me/relationships",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);

      const relationships: APIGetUserRelationshipsResult = omitArray(
         idFix(await prisma.relationship.getUserRelationships(payload.id, includeRelationshipUser)),
         ["ownerId", "userId"],
      );

      setResponseStatus(event, HttpCode.OK);
      return relationships;
   }),
);
