import { useValidatedParams } from "@huginn/backend-shared";

import { z } from "zod";

import { relationshipPost } from "../relationships.post";

const paramsSchema = z.object({ userId: z.string() });

export default defineEventHandler(async (event) => {
	const userId = (await useValidatedParams(event, paramsSchema)).userId;

	return relationshipPost(event, userId);
});
