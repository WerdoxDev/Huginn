import { useValidatedBody } from "@huginn/backend-shared";
import { type APIPostUniqueUsernameResult, HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { z } from "zod";
import { router } from "#server";
import { validateUsernameUnique } from "#utils/validation";

const schema = z.object({ username: z.string() });

router.post(
	"/unique-username",
	defineEventHandler(async (event) => {
		const body = await useValidatedBody(event, schema);

		const isUnique = await validateUsernameUnique(body.username.toLowerCase());
		const json: APIPostUniqueUsernameResult = { taken: !isUnique };

		setResponseStatus(event, HttpCode.OK);
		return json;
	}),
);
