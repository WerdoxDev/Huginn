import { useValidatedParams } from "@huginn/backend-shared";
import { defineEventHandler } from "h3";
import { z } from "zod";
import { router } from "#server";
import { relationshipPost } from "../relationships.post";

const paramsSchema = z.object({ userId: z.string() });

router.put(
	"/users/@me/relationships/:userId",
	defineEventHandler(async (event) => {
		const userId = (await useValidatedParams(event, paramsSchema)).userId;

		return relationshipPost(event, userId);
	}),
);
