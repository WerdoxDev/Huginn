import * as mongoose from "mongoose";
import { APIUser } from "@shared/api-types.ts";
import { Snowflake } from "@shared/types";

export async function connectToMongoDB(connectionString: string, dbName: string) {
   await mongoose.connect(connectionString, { dbName });
}

export type DBUser =
   | (mongoose.Document<unknown, object, APIUser> &
        APIUser &
        Required<{
           _id: Snowflake;
        }>)
   | null;
