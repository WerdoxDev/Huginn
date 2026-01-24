import { queryClient } from "@/root";
import { QueryClientProvider } from "@tanstack/react-query";
import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import PHProvider, { initializePosthog } from "@contexts/PHProvider";
import StartBackgroundSvg from "@components/StartBackgroundSvg";
import TitleBar from "@components/TitleBar";
import { useStartBackground } from "@stores/startBackgroundStore";
import { NotificationProvider } from "@contexts/NotificationContext";
import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import { useClientStore } from "@stores/clientStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { initializePresence } from "@stores/presenceStore";
import { initializeReadStates } from "@stores/readStatesStore";
import { initializeTyping } from "@stores/typingStore";
import { initializeUser } from "@stores/userStore";
import { initializeVoice } from "@stores/voiceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { type ReactNode, useEffect } from "react";
import { Outlet } from "react-router";
import KeybindsProvider from "@contexts/KeybindsProvider";
import SettingsProvider from "@contexts/SettingsProvider";
import { initializeStorage2 } from "@stores/storageStore";
import { initializeDevice } from "@stores/deviceStore";

export default function AppLayout() {
   const authBackground = useStartBackground();
   const clientStore = useClientStore();
   const huginnWindow = useHuginnWindow();
   const { isMainTransitioning } = useMainViewTransitionState();

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
                           style={isMainTransitioning ? { viewTransitionName: "start" } : undefined}
                        >
                           <StartBackgroundSvg state={authBackground.state} />

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
         {window.location.pathname !== "/splashscreen" && !huginnWindow.browserFullscreen && <TitleBar />}
         <div className="relative h-full w-full">
            {props.children}
            {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
            <ModalsRenderer />
            <ContextMenusRenderer />
         </div>
      </div>
   );
}
