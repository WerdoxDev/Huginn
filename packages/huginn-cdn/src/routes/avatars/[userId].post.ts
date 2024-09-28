import path from "node:path";
import { catchError, invalidFormBody } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, readFormData, setResponseStatus } from "h3";
import { router, storage } from "#cdn";
import { UPLOADS_DIR } from "#setup";

router.post(
	"/avatars/:userId",
	defineEventHandler(async (event) => {
		const [error, body] = await catchError(async () => await readFormData(event));

		if (error) {
			console.log(error);
			return invalidFormBody(event);
		}

		const file = body.get("files[0]");

		if (!body || !file || !(file instanceof File)) {
			return invalidFormBody(event);
		}

		await storage.writeFile("avatars", file.name, await file.arrayBuffer());
		// await Bun.write(path.resolve(UPLOADS_DIR, `avatars/${file.name}`), await file.arrayBuffer());

		setResponseStatus(event, HttpCode.CREATED);
		return file.name;
	}),
);
