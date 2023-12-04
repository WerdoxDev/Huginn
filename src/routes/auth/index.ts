import Elysia from "elysia";
import loginRoute from "./login";
import registerRoute from "./register";
import refreshTokenRoute from "./refresh-token";

const routes = new Elysia({ prefix: "/auth" }).use(loginRoute).use(registerRoute).use(refreshTokenRoute);

export default routes;
