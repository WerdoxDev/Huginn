import { APIPostLoginJSONBody, APIPostRegisterJSONBody } from "@shared/api-types";
import { snowflake } from "@shared/snowflake";
import { DBError, DBUser, assertUserIsDefined } from ".";
import { User } from "./user-schema";

export class DatabaseAuth {
   static async userByCredentials(credentials: APIPostLoginJSONBody): Promise<DBUser> {
      try {
         const user = await User.findOne({
            $or: [
               { email: credentials.email, password: credentials.password },
               { username: credentials.username, password: credentials.password },
            ],
         });

         assertUserIsDefined(user);
         return user;
      } catch (e) {
         throw new DBError(e, "userByCredentials");
      }
   }

   static async registerNewUser(user: APIPostRegisterJSONBody): Promise<DBUser> {
      try {
         const displayName = user.displayName || user.username;

         const newUser = new User({
            _id: snowflake.generate(),
            username: user.username,
            displayName,
            password: user.password,
            email: user.email,
            avatar: "test-avatar",
            flags: 0,
            system: false,
         });

         await newUser.save();

         return newUser;
      } catch (e) {
         throw new DBError(e, "registerNewUser");
      }
   }
}
