import { createRoute, invalidateToken } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { verifyJwt } from "#utils/route-utils";

createRoute("POST", "/api/auth/logout", verifyJwt(), async (c) => {
	const token = c.get("token");

	invalidateToken(token);

	return c.newResponse(null, HttpCode.NO_CONTENT);
});
