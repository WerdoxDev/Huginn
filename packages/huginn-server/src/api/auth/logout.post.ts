import { HttpCode } from "@huginn/shared";

import { tokenInvalidator } from "#setup";
import { useVerifiedJwt } from "#utils/route-utils";

export default defineEventHandler(async (event) => {
	const { token } = await useVerifiedJwt(event);

	tokenInvalidator.invalidate(token);

	return sendNoContent(event, HttpCode.NO_CONTENT);
});
