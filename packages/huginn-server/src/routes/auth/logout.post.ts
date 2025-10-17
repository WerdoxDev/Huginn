import { invalidateToken, verifyJwt } from "@huginn/backend-shared";
import Elysia from "elysia";

export const postLogout = new Elysia().use(verifyJwt()).post("/api/auth/logout", async ({ status, token }) => {
   invalidateToken(token);
   return status("No Content");
});
