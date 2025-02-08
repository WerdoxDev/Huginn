import { createRoute } from "@huginn/backend-shared";

createRoute("GET", "/api", (c) => {
	return c.text("API Home");
});
