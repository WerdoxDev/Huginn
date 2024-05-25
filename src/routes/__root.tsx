import { QueryClient } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";
import { Link, Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import "@tauri-apps/api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { useContext, useEffect, useRef, useState } from "react";
import TitleBar from "../components/TitleBar";
import SettingsModal from "../components/modal/SettingsModal";
import { HistoryContext } from "../contexts/historyContext";
import { ModalContext } from "../contexts/modalContext";
import { WindowContext } from "../contexts/windowContext";
import { setup } from "../lib/middlewares";

type RouterContext = {
   queryClient: QueryClient;
};

export const Route = createRootRouteWithContext<RouterContext>()({
   async beforeLoad() {
      await setup();
   },
   component: Root,
});

function Root() {
   const router = useRouter();

   const [isMaximized, setMaximized] = useState(() => (window.__TAURI__ ? false : true));

   const lastPathname = useRef<string | null>(null);

   const [settingsOpen, setSettingsOpen] = useState(false);

   useEffect(() => {
      router.subscribe("onBeforeLoad", (arg) => {
         lastPathname.current = arg.fromLocation.pathname;
      });
   }, []);

   return (
      <WindowContext.Provider value={{ maximized: { isMaximized: isMaximized, setMaximized: setMaximized } }}>
         <HistoryContext.Provider value={{ lastPathname: lastPathname.current }}>
            <ModalContext.Provider value={{ settings: { isOpen: settingsOpen, setIsOpen: setSettingsOpen } }}>
               <div className={`flex h-full flex-col overflow-hidden ${isMaximized ? "rounded-none" : "rounded-lg"}`}>
                  {router.state.location.pathname !== "/splashscreen" && <TitleBar />}
                  <div className="relative h-full w-full">
                     <Outlet />
                     <div className="absolute bottom-2 z-10">
                        <button onClick={() => localStorage.removeItem("refresh-token")}>Clear</button>
                        <Link to="/channels/$channelId" params={{ channelId: "177812771176452101" }}>
                           Channels
                        </Link>
                        <Link to="/channels/$channelId" params={{ channelId: "@me" }}>
                           ChannelsME
                        </Link>
                        <Link to="/login">Login</Link>
                        <Link to="/register">Register</Link>
                     </div>
                     <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" />
                     <TanStackRouterDevtools position="top-left" />
                     {window.__TAURI__ && <AppMaximizedEvent />}
                     <SettingsModal />
                  </div>
               </div>
            </ModalContext.Provider>
         </HistoryContext.Provider>
      </WindowContext.Provider>
   );
}

function AppMaximizedEvent() {
   const { setMaximized } = useContext(WindowContext).maximized;
   const unlistenFunction = useRef<UnlistenFn>();

   useEffect(() => {
      async function listenToAppResize() {
         const unlisten = await appWindow.onResized(async () => {
            const appMaximized = await appWindow.isMaximized();
            setMaximized(appMaximized);
         });

         unlistenFunction.current = unlisten;
      }

      listenToAppResize();

      return () => {
         unlistenFunction.current && unlistenFunction.current();
      };
   }, []);

   return null;
}
