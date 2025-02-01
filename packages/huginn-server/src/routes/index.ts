import { createRoute } from "@huginn/backend-shared";

createRoute("GET", "/", (c) => {
	return c.text("API Home");
});
