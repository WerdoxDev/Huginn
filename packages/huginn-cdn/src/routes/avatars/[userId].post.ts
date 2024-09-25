import path from "node:path";
import { catchError, invalidFormBody } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, readFormData, setResponseStatus } from "h3";
import { router } from "#cdn";
import { uploadsDir } from "#setup";

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

		await Bun.write(path.resolve(uploadsDir, `avatars/${file.name}`), await file.arrayBuffer());

		setResponseStatus(event, HttpCode.CREATED);
		return file.name;
	}),
);
