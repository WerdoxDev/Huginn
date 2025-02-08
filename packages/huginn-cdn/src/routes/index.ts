import { createRoute } from "@huginn/backend-shared";

createRoute("GET", "/cdn", (c) => {
	return c.text("CDN Home");
});
