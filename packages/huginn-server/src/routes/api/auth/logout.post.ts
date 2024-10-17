import { HttpCode } from "@huginn/shared";
import { defineEventHandler, setResponseStatus } from "h3";
import { router, tokenInvalidator } from "../../../server.ts";
import { useVerifiedJwt } from "../../../utils/route-utils.ts";

router.post(
	"/auth/logout",
	defineEventHandler(async (event) => {
		const { token } = await useVerifiedJwt(event);

		tokenInvalidator.invalidate(token);

		setResponseStatus(event, HttpCode.NO_CONTENT);
		return null;
	}),
);
