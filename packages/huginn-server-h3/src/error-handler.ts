import { createErrorFactory, ErrorFactory, logReject, logServerError } from "@huginn/backend-shared";
import { Errors, HttpCode, HuginnErrorData } from "@huginn/shared";

export default defineNitroErrorHandler((error, event) => {
   if (error.cause && !(error.cause instanceof Error) && typeof error.cause === "object" && "errors" in error.cause) {
      const status = event.context.forcedStatus;
      setResponseStatus(event, status);

      logReject(event.path, event.method, error.cause as HuginnErrorData, status);

      return send(event, JSON.stringify(error.cause), "application/json");
   }

   if (error.statusCode === HttpCode.NOT_FOUND) {
      setResponseStatus(event, HttpCode.NOT_FOUND, "Not Found");

      logReject(event.path, event.method, undefined, HttpCode.NOT_FOUND);

      return send(event, `${event.path} not found`);
   }

   if (isDBError(error.cause)) {
      // Common errors
      const dbError = error.cause;
      setResponseHeader(event, "content-type", "application/json");

      let errorFactory: ErrorFactory | undefined;

      if (error.cause.isErrorType(DBErrorType.INVALID_ID)) {
         setResponseStatus(event, HttpCode.BAD_REQUEST);
         errorFactory = createErrorFactory(Errors.invalidFormBody());
      }
      if (error.cause.isErrorType(DBErrorType.NULL_USER)) {
         setResponseStatus(event, HttpCode.NOT_FOUND);
         errorFactory = createErrorFactory(Errors.unknownUser(dbError.cause));
      }
      if (error.cause.isErrorType(DBErrorType.NULL_RELATIONSHIP)) {
         setResponseStatus(event, HttpCode.NOT_FOUND);
         errorFactory = createErrorFactory(Errors.unknownRelationship(dbError.cause));
      }
      if (error.cause.isErrorType(DBErrorType.NULL_CHANNEL)) {
         setResponseStatus(event, HttpCode.NOT_FOUND);
         errorFactory = createErrorFactory(Errors.unknownChannel(dbError.cause));
      }
      if (error.cause.isErrorType(DBErrorType.NULL_MESSAGE)) {
         setResponseStatus(event, HttpCode.NOT_FOUND);
         errorFactory = createErrorFactory(Errors.unknownMessage(dbError.cause));
      }

      if (errorFactory) {
         const status = getResponseStatus(event);
         logReject(event.path, event.method, errorFactory.toObject(), status);
         return send(event, JSON.stringify(errorFactory.toObject()));
      }
   }

   logServerError(event.path, error.cause as Error);
   return send(event, JSON.stringify(createErrorFactory(Errors.serverError()).toObject()));
});
