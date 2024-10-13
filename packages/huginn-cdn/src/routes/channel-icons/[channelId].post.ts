import { catchError, invalidFormBody, useValidatedParams } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { defineEventHandler, readFormData, setResponseStatus } from "h3";
import { z } from "zod";
import { router, storage } from "#cdn";

const schema = z.object({ channelId: z.string() });

router.post(
	"/channel-icons/:channelId",
	defineEventHandler(async (event) => {
		const { channelId } = await useValidatedParams(event, schema);
		const [error, body] = await catchError(async () => await readFormData(event));

		if (error) {
			console.log(error);
			return invalidFormBody(event);
		}

		const file = body.get("files[0]");

		if (!body || !file || !(file instanceof File)) {
			return invalidFormBody(event);
		}

		await storage.writeFile("channel-icons", channelId, file.name, await file.arrayBuffer());

		setResponseStatus(event, HttpCode.CREATED);
		return file.name;
	}),
);
