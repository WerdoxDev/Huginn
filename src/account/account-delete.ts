import { verifyToken } from "../token-handler";
import { getAccessToken } from "./account-handler";
import { ResponseResult } from "../response-result";
import { User } from "../database/user-schema";

export async function handleDelete(req: Request): Promise<Response> {
   const token = getAccessToken(req);
   const [isValid, tokenPayload] = await verifyToken(token);

   if (isValid && tokenPayload) {
      const deleteResult = await deleteUser(tokenPayload.id);

      return new ResponseResult(deleteResult);
   }

   return new ResponseResult(ErrorStatus.NOT_AUTHORIZED);
}

async function deleteUser(userId: string): Promise<DeleteUserStatus> {
   try {
      const deletedUser = await User.findByIdAndDelete(userId);

      if (!deletedUser) {
         return DeleteUserStatus.USER_DOES_NOT_EXIST;
      }

      return DeleteUserStatus.SUCCESS;
   } catch (e) {
      throw new Error("Unhandled Error in deleteUser!");
   }
}
