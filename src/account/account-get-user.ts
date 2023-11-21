import { ErrorStatus, GetUserStatus, IGetUserResult, IUser } from "shared/lib/types";
import { verifyToken } from "../token-handler";
import { getAccessToken } from "./account-handler";
import { ResponseResult } from "../response-result";
import { User } from "../database/user-schema";

export async function handleGetUser(req: Request): Promise<Response> {
   const token = getAccessToken(req);
   const [isValid, tokenPayload] = await verifyToken(token);

   if (isValid && tokenPayload) {
      const getResult = await getUserById(tokenPayload.id);

      return new ResponseResult(getResult);
   }

   return new ResponseResult(ErrorStatus.NOT_AUTHORIZED);
}

async function getUserById(id: string): Promise<IGetUserResult> {
   try {
      const dbUser = await User.findById(id);

      if (!dbUser) {
         return { status: GetUserStatus.USER_DOES_NOT_EXIST };
      }

      const user = {
         id: dbUser._id.toString(),
         username: dbUser.username,
         email: dbUser.email,
         password: dbUser.password,
      } satisfies IUser;

      return { user, status: GetUserStatus.SUCCESS };
   } catch (e) {
      throw new Error("Unhandled Error in getUserById!");
   }
}
