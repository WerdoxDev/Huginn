import {
	cdnOnError,
	handleCommonError,
	handleErrorFactory,
	handleServerError,
	serverOnError,
	sharedOnAfterResponse,
	sharedOnRequest,
} from "@huginn/backend-shared";

export default defineNitroPlugin((nitroApp) => {
	nitroApp.hooks.hook("request", async (event) => {
		return await sharedOnRequest(event);
	});
	nitroApp.hooks.hook("afterResponse", (event, { body }) => {
		return sharedOnAfterResponse(event, { body: body });
	});
	nitroApp.hooks.hook("error", (error, _event) => {
		// const event = _event.event;
		// const id = event.context.id;
		// const commonError = handleCommonError(error, event, id);
		// if (commonError) return commonError;
		// const errorFactory = serverOnError(error, event, undefined);
		// if (errorFactory) return handleErrorFactory(event, errorFactory, id);
		// return handleServerError(error, event, id);
	});
});
