import Elysia from "elysia";
import getChannelByIdRoute from "./get-channel-by-id";

const routes = new Elysia({ prefix: "/channels" }).use(getChannelByIdRoute);
export default routes;
