import { handleCommonError, handleErrorFactory, handleServerError, serverOnError } from "@huginn/backend-shared";

export default defineNitroErrorHandler((error, event) => {
	const id = event?.context?.id;
	setResponseStatus(event, event.context.overrideStatus ?? 500);

	const commonError = handleCommonError(error, event, id);
	if (commonError) return commonError;

	const errorFactory = serverOnError(error, event, undefined);
	if (errorFactory) return handleErrorFactory(event, errorFactory, id);

	return handleServerError(error, event, id);
});
