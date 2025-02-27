import { catchError, createRoute, invalidFormBody } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { storage } from "#setup";

createRoute("POST", "/cdn/attachments/:channelId/:messageId", async (c) => {
	const { channelId, messageId } = c.req.param();
	const [error, body] = await catchError(async () => await c.req.formData());

	if (error) {
		return invalidFormBody(c);
	}

	const file = body.get("files[0]");

	if (!body || !file || !(file instanceof File)) {
		return invalidFormBody(c);
	}

	// const arrayBuffer = await Bun.readableStreamToArrayBuffer(file.stream());
	// console.log(arrayBuffer.byteLength);
	await storage.writeFile("attachments", `${channelId}/${messageId}`, file.name, file.stream());

	return c.text(file.name, HttpCode.CREATED);
});
