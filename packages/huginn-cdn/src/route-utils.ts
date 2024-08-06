import { fileNotFound, invalidFileFormat, serverError } from "@huginn/backend-shared";
import { Context } from "hono";
import { CDNError, CDNErrorType, isCDNError } from "./error";

export async function handleRequest(
   c: Context,
   onRequest: (() => Promise<Response>) | (() => Response),
   onError?: (error: CDNError<Error>) => Response | undefined,
) {
   try {
      const result = await onRequest();
      return result;
   } catch (e) {
      if (isCDNError(e)) {
         let errorResult = onError?.(e);

         if (errorResult) {
            return errorResult;
         }

         // Common errors
         if (e.isErrorType(CDNErrorType.FILE_NOT_FOUND)) {
            return fileNotFound(c);
         }
         if (e.isErrorType(CDNErrorType.INVALID_FILE_FORMAT)) {
            return invalidFileFormat(c);
         }
      }

      return serverError(c, e);
   }
}
