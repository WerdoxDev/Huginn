import { DBError } from "./database-error";
import { User } from "./user-schema";

export async function existsInUsers(fieldName: string, value: unknown) {
   try {
      const exists = await User.exists({ [fieldName]: value });
      return exists !== null;
   } catch (e) {
      throw new DBError("existsInUsers", e);
   }
}
