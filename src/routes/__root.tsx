import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { client, initializeClient } from "../lib/api";

export const Route = createRootRoute({
   async beforeLoad() {
      if (!client) {
         initializeClient();
      }
      if (!client.isLoggedIn) {
         await client.login({ username: "test", password: "test" });
      }
   },
   component: () => (
      <>
         <Link to="/channel/$channelId" params={{ channelId: "177812771176452101" }}>
            Channels
         </Link>
         <Link to="/login">Login</Link>
         <Outlet />
         <TanStackRouterDevtools />
      </>
   ),
});
