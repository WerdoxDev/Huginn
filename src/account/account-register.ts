import {
   CreateUserStatus,
   ErrorStatus,
   ICreateUserResult,
   IRegisterUser,
   ITokenOption,
   UserRequestOption,
} from "shared/lib/types";
import { ResponseResult } from "../response-result";
import { User } from "../database/user-schema";
import { getUserAccessToken, getUserRefreshToken } from "../database/database-handler";
import { isUserRequestOption } from "./account-handler";

export async function handleRegister(req: Request): Promise<Response> {
   const options: unknown = await req.json();

   if (!isUserRequestOption<IRegisterUser, ITokenOption>(options)) {
      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   if (!isRegisterUser(options.user)) {
      return new ResponseResult(ErrorStatus.WRONG_INPUT);
   }

   const createResult = await createNewUser(options);

   return new ResponseResult(createResult);
}

async function createNewUser(
   options: UserRequestOption<IRegisterUser, ITokenOption>
): Promise<ICreateUserResult & ITokenOption> {
   if (await isEmailInUse(options.user.email)) {
      return { status: CreateUserStatus.EMAIL_EXISTS };
   }

   try {
      const newUser = new User({
         username: options.user.username,
         password: options.user.password,
         email: options.user.email,
      });

      await newUser.save();

      const accessToken = await getUserAccessToken(newUser._id.toString(), options.expireTime);
      const refreshToken = await getUserRefreshToken(newUser._id.toString(), options.expireTime);

      return { status: CreateUserStatus.SUCCESS, accessToken, refreshToken, expireTime: options.expireTime };
   } catch (e) {
      throw new Error("Unhandled Error in createNewUser!");
   }
}

async function isEmailInUse(email: string) {
   const exists = await User.exists({ email: email });
   return exists;
}

function isRegisterUser(object: unknown): object is IRegisterUser {
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
