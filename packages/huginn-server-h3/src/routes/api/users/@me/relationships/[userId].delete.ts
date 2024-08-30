import { router } from "@/server";
import { prisma } from "@database";
import { HttpCode } from "@huginn/shared";
import { dispatchToTopic } from "@utils/gateway-utils";
import { useValidatedParams, useVerifiedJwt } from "@utils/route-utils";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";

const schema = z.object({ userId: z.string() });

router.delete(
   "/users/@me/relationships/:userId",
   defineEventHandler(async event => {
      const { payload } = await useVerifiedJwt(event);
      const userId = (await useValidatedParams(event, schema)).userId;

      await prisma.relationship.deleteByUserId(payload.id, userId);

      dispatchToTopic(payload.id, "relationship_delete", userId);
      dispatchToTopic(userId, "relationship_delete", payload.id);

      setResponseStatus(event, HttpCode.OK);
      return null;
   }),
);
