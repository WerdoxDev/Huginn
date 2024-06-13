import { QueryClient } from "@tanstack/react-query";
import { Outlet, createRootRouteWithContext, useRouter } from "@tanstack/react-router";
import "@tauri-apps/api";
import { UnlistenFn } from "@tauri-apps/api/event";
import { appWindow } from "@tauri-apps/api/window";
import { useEffect, useRef } from "react";
import TitleBar from "../components/TitleBar";
import InfoModal from "../components/modal/InfoModal";
import SettingsModal from "../components/modal/SettingsModal";
import { useClient } from "../contexts/apiContext";
import { HistoryContext } from "../contexts/historyContext";
import { ModalProvider } from "../contexts/modalContext";
import { ThemeProvier } from "../contexts/themeContext";
import { useWindow, useWindowDispatch } from "../contexts/windowContext";
import { setup } from "../lib/middlewares";
// import { TanStackRouterDevtools } from "@tanstack/router-devtools";

export type HuginnRouterContext = {
   queryClient: QueryClient;
   client: ReturnType<typeof useClient>;
};

export const Route = createRootRouteWithContext<HuginnRouterContext>()({
   async beforeLoad({ context: { client } }) {
      await setup(client);
   },
   component: Root,
});

function Root() {
   const router = useRouter();

   const lastPathname = useRef<string | null>(null);
   const appWindow = useWindow();

   useEffect(() => {
      router.subscribe("onBeforeLoad", (arg) => {
         lastPathname.current = arg.fromLocation.pathname;
      });
   }, []);

   return (
      <HistoryContext.Provider value={{ lastPathname: lastPathname.current }}>
         <ThemeProvier>
            <ModalProvider>
               <div className={`flex h-full flex-col overflow-hidden ${appWindow.maximized ? "rounded-none" : "rounded-lg"}`}>
                  {router.state.location.pathname !== "/splashscreen" && <TitleBar />}
                  <div className="relative h-full w-full">
                     <Outlet />
                     {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
                     {/* <TanStackRouterDevtools position="bottom-left" toggleButtonProps={{ className: "top-6" }} /> */}
                     {window.__TAURI__ && <AppMaximizedEvent />}
                     <SettingsModal />
                     <InfoModal />
                  </div>
               </div>
            </ModalProvider>
         </ThemeProvier>
      </HistoryContext.Provider>
   );
}

function AppMaximizedEvent() {
   const dispatch = useWindowDispatch();
   const unlistenFunction = useRef<UnlistenFn>();

   useEffect(() => {
      async function listenToAppResize() {
         const unlisten = await appWindow.onResized(async () => {
            const appMaximized = await appWindow.isMaximized();
            dispatch({ maximized: appMaximized });
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
