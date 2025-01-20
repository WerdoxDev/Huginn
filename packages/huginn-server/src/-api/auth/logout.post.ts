import { HttpCode } from "@huginn/shared";
import { defineEventHandler, sendNoContent, setResponseStatus } from "h3";
import { router, tokenInvalidator } from "#server";
import { useVerifiedJwt } from "#utils/route-utils";

router.post(
	"/auth/logout",
	defineEventHandler(async (event) => {
		const { token } = await useVerifiedJwt(event);

		tokenInvalidator.invalidate(token);

		return sendNoContent(event, HttpCode.NO_CONTENT);
	}),
);
