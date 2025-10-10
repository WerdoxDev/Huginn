import { invalidateToken, verifyJwt2 } from "@huginn/backend-shared";
import Elysia from "elysia";

export const postLogout = new Elysia().use(verifyJwt2()).post("/api/auth/logout", async ({ status, token }) => {
   invalidateToken(token);
   return status("No Content");
});
