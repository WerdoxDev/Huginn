import { Snowflake } from "@shared/types";
import { User } from "./user-schema";
import { DBUser } from "./database-handler";
import { DBError } from "./database-error";

export async function getUserById(id: Snowflake, filter?: string): Promise<DBUser> {
   try {
      const user = await User.findById(id, filter).exec();
      return user;
   } catch (e) {
      throw new DBError("getUserById", e);
   }
}
