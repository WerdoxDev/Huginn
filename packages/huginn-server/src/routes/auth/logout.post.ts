import { createRoute } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { tokenInvalidator } from "#setup";
import { verifyJwt } from "#utils/route-utils";

createRoute("POST", "/api/auth/logout", verifyJwt(), async (c) => {
	const token = c.get("token");

	tokenInvalidator.invalidate(token);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
