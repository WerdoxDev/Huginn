import { catchError, createRoute, invalidFormBody } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { storage } from "#setup";

createRoute("POST", "/cdn/channel-icons/:channelId", async (c) => {
	const { channelId } = c.req.param();
	const [error, body] = await catchError(async () => await c.req.formData());

	if (error) {
		return invalidFormBody(c);
	}

	const file = body.get("files[0]");

	if (!body || !file || !(file instanceof File)) {
		return invalidFormBody(c);
	}

	await storage.writeFile("channel-icons", channelId, file.name, file.stream());

	return c.text(file.name, HttpCode.CREATED);
});
