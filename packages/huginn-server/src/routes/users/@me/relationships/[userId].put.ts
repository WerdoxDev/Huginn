import { createRoute, verifyJwt } from "@huginn/backend-shared";
import { relationshipPost } from "../relationships.post";

createRoute("PUT", "/api/users/@me/relationships/:userId", verifyJwt(), async (c) => {
   const { userId } = c.req.param();
   return relationshipPost(c, userId);
});
