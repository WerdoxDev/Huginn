import { APIPostLoginJSONBody, APIPostRegisterJSONBody } from "@shared/api-types";
import { snowflake } from "@shared/snowflake";
import { DBUser } from "./database-handler";
import { User } from "./user-schema";
import { DBError } from "./database-error";

export async function userByCredentials(credentials: APIPostLoginJSONBody): Promise<DBUser> {
   try {
      const user = await User.findOne({
         $or: [
            { email: credentials.email, password: credentials.password },
            { username: credentials.username, password: credentials.password },
         ],
      });

      return user;
   } catch (e) {
      throw new DBError("userByCredentials", e);
   }
}

export async function registerNewUser(user: APIPostRegisterJSONBody): Promise<DBUser> {
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
      throw new DBError("registerNewUser", e);
   }
}
