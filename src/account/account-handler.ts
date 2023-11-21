import { Server } from "bun";
import { handleRegister } from "./account-register";
import { handleLogin } from "./account-login";
import { handleDelete } from "./account-delete";
import { handleEdit } from "./account-edit";
import { TokenInvalidator } from "./token-invalidator";
import { handleGetUser } from "./account-get-user";
import { UserRequestOption } from "shared/lib/types";

export const tokenInvalidator = new TokenInvalidator();

export async function handleAccountRequest(url: URL, req: Request, _server: Server): Promise<Response> {
   if (url.pathname.includes("/account/register")) {
      return handleRegister(req);
   }

   if (url.pathname.includes("/account/login")) {
      return handleLogin(req);
   }

   if (url.pathname.includes("/account/edit")) {
      return handleEdit(req);
   }

   if (url.pathname.includes("/account/delete")) {
      return handleDelete(req);
   }

   if (url.pathname.includes("/account/get-user")) {
      return handleGetUser(req);
   }

   return new Response("Account request was not found :(", { status: 404 });
}

export function getAccessToken(req: Request): string {
   const authHeader = req.headers.get("authorization");
   const token = authHeader && authHeader.split(" ")[1];

   return token || "";
}

export function isUserRequestOption<T, U>(object: unknown): object is UserRequestOption<T, U> {
   if (object !== null && typeof object === "object") {
      return "user" in object;
   }

   return false;
}
