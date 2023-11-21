import {
   ErrorStatus,
   ILoginUser,
   ValidateUserCredentialsStatus,
   IValidateUserCredentialsResult,
   ITokenOption,
   UserRequestOption,
} from "shared/lib/types";
import { DBUser, getUserAccessToken, getUserRefreshToken } from "../database/database-handler";
import { ResponseResult } from "../response-result";
import { User } from "../database/user-schema";
import { isUserRequestOption } from "./account-handler";

export async function handleLogin(req: Request): Promise<Response> {
   const options: unknown = await req.json();

   if (!isUserRequestOption<ILoginUser, ITokenOption>(options)) {
      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   if (!isLoginUser(options.user)) {
      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   if (!validateLoginUser(options.user)) {
      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   const validateResult = await validateUserCredentials(options);

   return new ResponseResult(validateResult);
}

async function validateUserCredentials(
   options: UserRequestOption<ILoginUser, ITokenOption>
): Promise<IValidateUserCredentialsResult & ITokenOption> {
   const user = await getUserByCredentials(options.user);

   if (!user) {
      return { status: ValidateUserCredentialsStatus.INVALID_CREDENTIALS };
   }

   const accessToken = await getUserAccessToken(user.id.toString(), options.expireTime);
   const refreshToken = await getUserRefreshToken(user.id.toString(), options.expireTime);

   return { status: ValidateUserCredentialsStatus.SUCCESS, accessToken, refreshToken, expireTime: options.expireTime };
}

async function getUserByCredentials(userCredentials: ILoginUser): Promise<DBUser> {
   try {
      const user = await User.findOne({
         $or: [
            { email: userCredentials.email, password: userCredentials.password },
            { username: userCredentials.username, password: userCredentials.password },
         ],
      });

      return user;
   } catch (e) {
      throw new Error("Unhandled Error in getUserByCredentials!");
   }
}

function isLoginUser(object: unknown): object is ILoginUser {
   if (object !== null && typeof object === "object") {
      return "password" in object && ("email" in object || "username" in object);
   }

   return false;
}

function validateLoginUser(user: ILoginUser): boolean {
   if (!user.password) return false;
   if (!user.email && !user.username) return false;

   return true;
}
