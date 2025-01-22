import {
	commonHandlers,
	handleCommonError,
	handleErrorFactory,
	handleServerError,
	serverOnError,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";

export default defineNitroPlugin((nitroApp) => {
	commonHandlers(nitroApp);

	nitroApp.hooks.hook("request", async (event) => {
		return await sharedOnRequest(event);
	});
	nitroApp.hooks.hook("afterResponse", (event, body) => {
		return sharedOnAfterResponse(event, { body: body });
	});
});
