import { catchError, invalidFormBody, useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, readFormData, setResponseStatus } from "h3";
import { z } from "zod";
import { storage } from "#setup";

const schema = z.object({ userId: z.string() });

export default defineEventHandler(async (event) => {
	const { userId } = await useValidatedParams(event, schema);
	const [error, body] = await catchError(async () => await readFormData(event));

	if (error) {
		return invalidFormBody(event);
	}

	const file = body.get("files[0]");

	if (!body || !file || !(file instanceof File)) {
		return invalidFormBody(event);
	}

	await storage.writeFile("avatars", userId, file.name, await file.arrayBuffer());

	setResponseStatus(event, HttpCode.CREATED);
	return file.name;
});
