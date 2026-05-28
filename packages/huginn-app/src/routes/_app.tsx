import { App } from "@capacitor/app";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import StartBackground from "@components/StartBackgroundSvg";
import TitleBar from "@components/TitleBar";
import KeybindsProvider from "@contexts/KeybindsProvider";
import { NotificationProvider } from "@contexts/NotificationContext";
import PHProvider, { initializePosthog } from "@contexts/PHProvider";
import SettingsProvider from "@contexts/SettingsProvider";
import { useClientStore } from "@stores/clientStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { initializeDevice } from "@stores/deviceStore";
import { initializePresence } from "@stores/presenceStore";
import { initializeReadStates } from "@stores/readStatesStore";
import { initializeStorage2 } from "@stores/storageStore";
import { initializeTyping } from "@stores/typingStore";
import { initializeUser } from "@stores/userStore";
import { initializeVoice } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute, Outlet, useNavigate } from "@tanstack/react-router";
import clsx from "clsx";
import { type ReactNode, useEffect } from "react";

import { queryClient } from "@/lib/queries";

export const Route = createFileRoute("/_app")({ component: AppLayoutComponent });

function AppLayoutComponent() {
   const clientStore = useClientStore();
   const huginnWindow = useHuginnWindow();

   useEffect(() => {
      const unlisteners: Array<(() => void) | undefined> = [];

      if (clientStore.isInitialized) {
         unlisteners.push(initializeStorage2());
         unlisteners.push(initializeUser());
         unlisteners.push(initializeReadStates());
         unlisteners.push(initializePresence());
         unlisteners.push(initializeTyping());
         unlisteners.push(initializeVoice());
         initializePosthog();
         initializeDevice().then((x) => unlisteners.push(x));

         return () => {
            for (const unlisten of unlisteners) {
               unlisten?.();
            }
         };
      }
   }, [clientStore.isInitialized]);

   return (
      <QueryClientProvider client={queryClient}>
         <SettingsProvider>
            <KeybindsProvider>
               <ContextMenuProvider>
                  <NotificationProvider>
                     <MainRenderer>
                        <div
                           className={clsx("bg-surface-alt absolute inset-0", !huginnWindow.browserFullscreen && "top-6")}
                           style={{ viewTransitionName: "start" }}
                        >
                           <StartBackground />
                           <PHProvider>
                              <Outlet />
                           </PHProvider>
                        </div>
                     </MainRenderer>
                  </NotificationProvider>
               </ContextMenuProvider>
            </KeybindsProvider>
         </SettingsProvider>
      </QueryClientProvider>
   );
}

function MainRenderer(props: { children: ReactNode }) {
   const huginnWindow = useHuginnWindow();

   return (
      <div className={clsx("flex h-full flex-col overflow-hidden")}>
         {!huginnWindow.browserFullscreen && <TitleBar />}
         <div className="relative h-full w-full">
            {props.children}
            {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
            <ModalsRenderer />
            <ContextMenusRenderer />
            <CapUrlListener />
         </div>
      </div>
   );
}

function CapUrlListener() {
   const navigate = useNavigate();

   useEffect(() => {
      App.addListener("appUrlOpen", (event) => {
         const slug = event.url.split(".app").pop();
         console.log(slug);
      });
   }, []);

   return null;
}
