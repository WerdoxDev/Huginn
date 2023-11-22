import Elysia from "elysia";
import loginRoute from "./login";
import registerRoute from "./register";

const routes = new Elysia({ prefix: "/auth" }).use(loginRoute).use(registerRoute);

export default routes;
