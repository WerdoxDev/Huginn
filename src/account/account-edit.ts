import { EditUserStatus, ErrorStatus, IEditUser } from "shared/lib/types";
import { verifyToken } from "../token-handler";
import { getAccessToken } from "./account-handler";
import { ResponseResult } from "../response-result";
import { User } from "../database/user-schema";

export async function handleEdit(req: Request): Promise<Response> {
   const token = getAccessToken(req);
   const [isValid, tokenPayload] = await verifyToken(token);

   if (isValid && tokenPayload) {
      const user = await req.json();

      if (isEditUser(user)) {
         const editResult = await editUser(user);

         return new ResponseResult(editResult);
      }

      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   return new ResponseResult(ErrorStatus.NOT_AUTHORIZED);
}

async function editUser(editUser: IEditUser): Promise<EditUserStatus> {
   try {
      const editedUser = await User.findByIdAndUpdate(editUser.id, {
         $set: { username: editUser.username, email: editUser.email, password: editUser.password },
      });

      if (!editedUser) {
         return EditUserStatus.USER_DOES_NOT_EXIST;
      }

      if (
         editedUser.email === editUser.email &&
         editedUser.username === editUser.username &&
         editedUser.password === editUser.password
      ) {
         return EditUserStatus.NOTHING_CHANGED;
      }

      return EditUserStatus.SUCCESS;
   } catch (e) {
      throw new Error("Unhandled Error in editUser!");
   }
}

function isEditUser(object: unknown): object is IEditUser {
   if (object !== null && typeof object === "object") {
      return (
         "username" in object &&
         "email" in object &&
         "password" in object &&
         object.username !== "" &&
         object.email !== "" &&
         object.password !== ""
      );
   }

   return false;
}
