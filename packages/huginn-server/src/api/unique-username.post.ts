import { useValidatedBody } from "@huginn/backend-shared";
import { type APIPostUniqueUsernameResult, HttpCode } from "@huginn/shared";
import { z } from "zod";
import { validateUsernameUnique } from "#utils/validation";

const schema = z.object({ username: z.string() });

export default defineEventHandler(async (event) => {
	const body = await useValidatedBody(event, schema);

	const isUnique = await validateUsernameUnique(body.username.toLowerCase());
	const json: APIPostUniqueUsernameResult = { taken: !isUnique };

	setResponseStatus(event, HttpCode.OK);
	return json;
});
