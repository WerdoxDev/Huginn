import { router } from "#server";
import { prisma } from "#database";
import { useValidatedParams } from "@huginn/backend-shared";
import { APIGetUserByIdResult, HttpCode, idFix, omit } from "@huginn/shared";
import { useVerifiedJwt } from "#utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ userId: z.string() });

router.get(
   "/users/:userId",
   defineEventHandler(async event => {
      await useVerifiedJwt(event);
      const userId = (await useValidatedParams(event, schema)).userId;

      const user: APIGetUserByIdResult = idFix(omit(await prisma.user.getById(userId), ["email"]));

      setResponseStatus(event, HttpCode.OK);
      return user;
   }),
);
