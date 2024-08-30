import { includeRelationshipUser } from "@/database/common";
import { router } from "@/server";
import { prisma } from "@database";
import { APIGetUserRelationshipByIdResult, idFix, omit, HttpCode } from "@huginn/shared";
import { useValidatedParams, useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ userId: z.string() });

router.get(
   "/users/@me/relationships/:userId",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const userId = (await useValidatedParams(event, schema)).userId;

      const relationship: APIGetUserRelationshipByIdResult = idFix(
         omit(await prisma.relationship.getByUserId(payload.id, userId, includeRelationshipUser), ["ownerId", "userId"]),
      );

      setResponseStatus(event, HttpCode.OK);
      return relationship;
   }),
);
