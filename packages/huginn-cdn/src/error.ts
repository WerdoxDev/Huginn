export class CDNError extends Error {
   public constructor(
      public callerName: string,
      public type: CDNErrorType,
      public cause?: string,
   ) {
      super(`Unhandeled CDN Error => ${callerName} => ${type}: ${cause ? `(${cause})` : ""}`, {
         cause: cause,
      });
   }

   isErrorType(type: CDNErrorType) {
      return this.type === type;
   }
}

export function isCDNError(object: unknown): object is CDNError {
   if (object !== null && typeof object === "object" && object instanceof CDNError) {
      return true;
   }

   return false;
}

export enum CDNErrorType {
   FILE_NOT_FOUND = "FILE_NOT_FOUND",
   INVALID_FILE_FORMAT = "INVALID_FILE_FORMAT",
}
