import mongoose from "mongoose";

export class Database {
   public static async initialize(connectionString: string, dbName: string) {
      await mongoose.connect(connectionString, { dbName });
   }
}

export * from "./database-auth";
export * from "./database-user";
export * from "./database-common";
export * from "./database-error";
