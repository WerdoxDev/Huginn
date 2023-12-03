import Elysia from "elysia";
import getCurrentUserRoute from "./get-current-user";
import getUserByIdRoute from "./get-user-by-id";

const routes = new Elysia({ prefix: "/users" }).use(getCurrentUserRoute).use(getUserByIdRoute);

export default routes;
