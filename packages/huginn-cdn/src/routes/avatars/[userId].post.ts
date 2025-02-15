import { catchError, createRoute, invalidFormBody, validator } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { z } from "zod";
import { storage } from "#setup";

createRoute("POST", "/cdn/avatars/:userId", async (c) => {
	const { userId } = c.req.param();
	const [error, body] = await catchError(async () => await c.req.formData());

	if (error) {
		return invalidFormBody(c);
	}

	const file = body.get("files[0]");

	if (!body || !file || !(file instanceof File)) {
		return invalidFormBody(c);
	}

	await storage.writeFile("avatars", userId, file.name, await file.arrayBuffer());

	return c.text(file.name, HttpCode.CREATED);
});
