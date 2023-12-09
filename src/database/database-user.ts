import { Snowflake } from "@shared/types";
import { User } from "./user-schema";
import { DBError, assertUserIsDefined } from ".";
import { APIPatchCurrentUserJSONBody } from "@shared/api-types";

export class DatabaseUser {
   static async getUserById(id: Snowflake, filter?: string) {
      try {
         const user = await User.findById(id, filter).exec();
         assertUserIsDefined(user, id);
         return user;
      } catch (e) {
         throw new DBError(e, "getUserById");
      }
   }
   static async updateUser(id: Snowflake, updatedUser: APIPatchCurrentUserJSONBody) {
      try {
         const user = await User.findByIdAndUpdate(id, { ...updatedUser }, { new: true }).exec();
         assertUserIsDefined(user, id);
         return user;
      } catch (e) {
         throw new DBError(e, "updateUser");
      }
   }
   static async existsInUsers(fieldName: string, value: unknown) {
      try {
         const exists = await User.exists({ [fieldName]: value }).exec();
         return exists !== null;
      } catch (e) {
         throw new DBError(e, "existsInUsers");
      }
   }
}
