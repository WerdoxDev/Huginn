import { InternalRequest } from "@shared/rest-types";
import { HuginnError, HuginnErrorData, HuginnErrorGroupWrapper, RequestBody, isErrorResponse } from "@shared/errors";

export class HuginnAPIError extends Error {
   public requestBody: RequestBody;

   /**
    * @param rawError - The error reported by Huginn
    * @param code - The error code reported by Huginn
    * @param status - The status code of the response
    * @param method - The method of the request that errored
    * @param url - The url of the request that erred
    * @param bodyData - The unparsed data for the request that errored
    */
   public constructor(
      public rawError: HuginnErrorData,
      public code: number | string,
      public status: number,
      public method: string,
      public url: string,
      // TODO: add 'files' here
      bodyData: Pick<InternalRequest, "body">
   ) {
      super(HuginnAPIError.getMessage(rawError, status));

      // TODO: add 'files: bodyData.files'
      this.requestBody = { json: bodyData.body };
   }

   private static getMessage(error: HuginnErrorData, status: number) {
      let flattened = "";

      if (error.errors) {
         flattened = [...this.flattenHuginnError(error.errors)].join("\n");
      }

      return error.message && flattened
         ? `${error.message}\n${flattened}`
         : error.message || flattened || `Unknown Error with status: ${status}`;
   }

   public override get name(): string {
      return `${HuginnAPIError.name}[${this.code}]`;
   }

   private static *flattenHuginnError(obj: HuginnError | HuginnErrorGroupWrapper, key = ""): IterableIterator<string> {
      if (isErrorResponse(obj)) {
         return yield `${key.length ? `${key}[${obj.code}]` : `${obj.code}`}: ${obj.message}`.trim();
      }

      for (const [otherKey, val] of Object.entries(obj)) {
         const nextKey = otherKey.startsWith("_")
            ? key
            : key
            ? Number.isNaN(Number(otherKey))
               ? `${key}.${otherKey}`
               : `${key}[${otherKey}]`
            : otherKey;

         if (typeof val === "string") {
            yield val;
         }
         //  else if (isErrorGroupWrapper(val)) {
         //    for (const error of val._errors) {
         //       yield* this.flattenHuginnError(error, nextKey);
         //    }
         // }
         else {
            yield* this.flattenHuginnError(val, nextKey);
         }
      }
   }
}
