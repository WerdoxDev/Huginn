import { Link, Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import "@tauri-apps/api";
import { useEffect, useState } from "react";
import { WindowContext } from "../contexts/windowContext";
import useAppMaximized from "../hooks/useAppMaximized";
import { setup } from "../lib/middlewares";

export const Route = createRootRoute({
   async beforeLoad() {
      await setup();
   },
   component: Root,
});

function Root() {
   const [isMaximized, setMaximized] = useState(false);

   return (
      <WindowContext.Provider value={{ maximized: { isMaximized: isMaximized, setMaximized: setMaximized } }}>
         <button onClick={() => localStorage.removeItem("refresh-token")}>Clear</button>
         <Link to="/channels/$channelId" params={{ channelId: "177812771176452101" }}>
            Channels
         </Link>
         <Link to="/login">Login</Link>
         <Outlet />
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
