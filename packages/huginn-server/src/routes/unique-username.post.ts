import { createRoute, validator } from "@huginn/backend-shared";
import { type APIPostUniqueUsernameResult, HttpCode } from "@huginn/shared";
import { z } from "zod";
import { validateUsernameUnique } from "#utils/validation";

const schema = z.object({ username: z.string() });

createRoute("POST", "/api/unique-username", validator("json", schema), async (c) => {
	const body = c.req.valid("json");

	const isUnique = await validateUsernameUnique(body.username.toLowerCase());
	const json: APIPostUniqueUsernameResult = { taken: !isUnique };

	return c.json(json, HttpCode.OK);
});
