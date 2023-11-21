import * as mongoose from "mongoose";
import { APIUser } from "$shared/api-types.ts";
import { Snowflake } from "$shared/types";

export async function connectToMongoDB(connectionString: string, dbName: string) {
   await mongoose.connect(connectionString, { dbName });
}

// export async function getUserAccessToken(userId: string, expireTime?: string): Promise<string> {
//    const dbUser = await User.findById(userId);

//    if (!dbUser) {
//       return "";
//    }

//    const tokenUser = { id: dbUser.id } satisfies TokenPayload;
//    const accessToken = generateUserAccessToken(tokenUser, expireTime);
//    return accessToken;
// }

// export async function getUserRefreshToken(userId: string, expireTime?: string): Promise<string> {
//    const accessToken = generateUserRefreshToken(userId, expireTime);
//    return accessToken;
// }

export type DBUser =
   | (mongoose.Document<unknown, object, APIUser> &
        APIUser &
        Required<{
           _id: Snowflake;
        }>)
   | null;
