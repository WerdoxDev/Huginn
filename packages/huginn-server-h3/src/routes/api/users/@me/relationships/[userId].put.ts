import { router } from "@/server";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { relationshipPost } from "../relationships.post";
import { useValidatedParams } from "@huginn/backend-shared";

const paramsSchema = z.object({ userId: z.string() });

router.put(
   "/users/@me/relationships/:userId",
   defineEventHandler(async event => {
      const userId = (await useValidatedParams(event, paramsSchema)).userId;

      return relationshipPost(event, userId);
   }),
);
