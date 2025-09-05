import { createRoute, invalidateToken, verifyJwt } from "@huginn/backend-shared";
import { HttpCode } from "@huginn/shared";

createRoute("POST", "/api/auth/logout", verifyJwt(), async (c) => {
   const token = c.get("token");

   invalidateToken(token);

   return c.newResponse(null, HttpCode.NO_CONTENT);
});
