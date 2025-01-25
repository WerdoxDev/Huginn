import { cdnOnError, handleCommonError, handleErrorFactory, handleServerError } from "@huginn/backend-shared";

export default defineNitroErrorHandler((error, event) => {
	const id = event?.context?.id;
	setResponseStatus(event, event.context.overrideStatus ?? 500);

	const commonError = handleCommonError(error, event, id);
	if (commonError) return commonError;

	const errorFactory = cdnOnError(error, event, undefined);
	if (errorFactory) return handleErrorFactory(event, errorFactory, id);

	return handleServerError(error, event, id);
});
