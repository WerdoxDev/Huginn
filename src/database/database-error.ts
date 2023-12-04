export class DBError<T> extends Error {
   public constructor(public error: T, methodName: string) {
      super(`Unhandled error in ${methodName}! => ${error}`);
   }
}

export function throwUserNull(): never {
   throw new Error(DatabaseError.NULL_USER);
}

export function isDBError(object: unknown): object is DBError<Error> {
   if (object != null && typeof object === "object") {
      return "error" in object;
   }

   return false;
}

export enum DatabaseError {
   NULL_USER = "NULL_USER",
}
