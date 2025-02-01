import { catchError, createRoute, invalidFormBody, validator } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { z } from "zod";
import { storage } from "#setup";

const schema = z.object({ userId: z.string() });

createRoute("POST", "/avatars/:userId", validator("param", schema), async (c) => {
	const { userId } = c.req.param();
	const [error, body] = await catchError(async () => await c.req.formData());

	if (error) {
		return invalidFormBody(c);
	}

	const file = body.get("files[0]");

	if (!body || !file || !(file instanceof File)) {
		return invalidFormBody(c);
	}

	await storage.writeFile("avatars", userId, file.name, file.stream());

	return c.text(file.name, HttpCode.CREATED);
});
