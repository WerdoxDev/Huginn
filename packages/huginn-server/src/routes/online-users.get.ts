import { createRoute } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";
import { gateway } from "#setup";

createRoute("GET", "/api/online-users", async (c) => {
	return c.json({ count: gateway.getSessionsCount() }, HttpCode.OK);
});
