import { router } from "@/server";
import { useValidatedParams } from "@utils/route-utils";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { relationshipPost } from "../relationships.post";

const paramsSchema = z.object({ userId: z.string() });

router.put(
   "/users/@me/relationships/:userId",
   defineEventHandler(async event => {
      const userId = (await useValidatedParams(event, paramsSchema)).userId;

      return relationshipPost(event, userId);
   }),
);
