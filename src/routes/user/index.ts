import Elysia from "elysia";
import getCurrentUserRoute from "./get-current-user";
import getUserByIdRoute from "./get-user-by-id";
import patchCurrentUserRoute from "./patch-current-user";
import createDmRoute from "./create-dm";
import getUserChannelsRoute from "./get-user-channels";

const routes = new Elysia({ prefix: "/users" })
   .use(getCurrentUserRoute)
   .use(getUserByIdRoute)
   .use(patchCurrentUserRoute)
   .use(createDmRoute)
   .use(getUserChannelsRoute);

export default routes;
