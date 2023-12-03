export class DBError extends Error {
   public constructor(methodName: string, error: unknown) {
      super(`Unhandled error in ${methodName}! => ${error}`);
   }
}
