import { Link, Outlet, createRootRoute, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import "@tauri-apps/api";
import { useEffect, useState } from "react";
import { WindowContext } from "../contexts/windowContext";
import useAppMaximized from "../hooks/useAppMaximized";
import { setup } from "../lib/middlewares";
import { AnimatedRouteContext } from "../contexts/AnimatedRouteContext";

export const Route = createRootRoute({
   async beforeLoad() {
      await setup();
   },
   component: Root,
});

function Root() {
   const router = useRouter();
   const [isMaximized, setMaximized] = useState(false);
   const [context, setContext] = useState(() => router);

   return (
      <WindowContext.Provider value={{ maximized: { isMaximized: isMaximized, setMaximized: setMaximized } }}>
         <button onClick={() => localStorage.removeItem("refresh-token")}>Clear</button>
         <Link to="/channels/$channelId" params={{ channelId: "177812771176452101" }}>
            Channels
         </Link>
         <Link to="/login">Login</Link>
         <Link to="/register">Register</Link>
         <AnimatedRouteContext.Provider value={{ context, setContext }}>
            <Outlet />
         </AnimatedRouteContext.Provider>
         <TanStackRouterDevtools />
         {window.__TAURI__ && <AppMaximizedEvent />}
      </WindowContext.Provider>
   );
}

function AppMaximizedEvent() {
   const { unlistenEvent: unlistenAppMaximized } = useAppMaximized();

   useEffect(() => {
      return () => {
         unlistenAppMaximized && unlistenAppMaximized();
      };
   });

   return <></>;
}
