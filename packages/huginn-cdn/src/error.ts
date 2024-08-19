export class CDNError<T extends Error> extends Error {
   public constructor(
      public error: T,
      methodName: string,
      cause?: string,
   ) {
      super(
         `Unhandeled CDN Error => ${methodName} => ${error.name}: ${error.message} ${error.cause ? `(${error.cause as string})` : ""}`,
         {
            cause,
         },
      );
      this.flattenError(this.error);
   }

   isErrorType(type: CDNErrorType) {
      if (this.error instanceof Error) {
         return (this.error.message as CDNErrorType) === type;
      }
   }

   flattenError(error: unknown) {
      if (error instanceof CDNError) {
         this.error = error.error;
         this.flattenError(error.error);
      }
   }
}

export function isCDNError(object: unknown): object is CDNError<Error> {
   if (object !== null && typeof object === "object" && object instanceof CDNError && object.error instanceof Error) {
      return true;
   }

   return false;
}

export enum CDNErrorType {
   FILE_NOT_FOUND = "FILE_NOT_FOUND",
   INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
}
