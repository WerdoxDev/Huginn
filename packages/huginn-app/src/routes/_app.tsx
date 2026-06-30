import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import PopoverRenderer from "@components/popover/PopoverRenderer";
import StartBackground from "@components/StartBackgroundSvg";
import TitleBar from "@components/TitleBar";
import { InsetProvider } from "@contexts/InsetContext";
import KeybindsProvider from "@contexts/KeybindsProvider";
import SettingsProvider from "@contexts/SettingsProvider";
import { useInitDeviceStore } from "@hooks/initializers/useInitDeviceStore";
import { useInitPresenceStore } from "@hooks/initializers/useInitPresenceStore";
import { useInitReadStateStore } from "@hooks/initializers/useInitReadStateStore";
import { useInitStorageStore } from "@hooks/initializers/useInitStorageStore";
import { useInitTypingStore } from "@hooks/initializers/useInitTypingStore";
import { useInitUserStore } from "@hooks/initializers/useInitUserStore";
import { useInitVoiceStore } from "@hooks/initializers/useInitVoiceStore";
import { useBackButtonManager } from "@hooks/useBackButtonManager";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { PopoverProvider } from "@stores/popoverStore";
import { useHuginnWindow } from "@stores/windowStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import clsx from "clsx";

import { queryClient } from "@/lib/queries";

export const Route = createFileRoute("/_app")({ component: AppLayoutComponent });

function AppLayoutComponent() {
   const huginnWindow = useHuginnWindow();

   useBackButtonManager();

   useInitStorageStore();
   useInitUserStore();
   useInitReadStateStore();
   useInitPresenceStore();
   useInitTypingStore();
   useInitVoiceStore();
   useInitDeviceStore();

   return (
      <QueryClientProvider client={queryClient}>
         <SettingsProvider>
            <KeybindsProvider>
               <ContextMenuProvider>
                  <PopoverProvider>
                     <InsetProvider>
                        <div className={clsx("flex h-full flex-col overflow-hidden")}>
                           {!huginnWindow.browserFullscreen && <TitleBar />}
                           <div className="relative h-full w-full">
                              <div
                                 className={clsx("bg-surface-alt absolute inset-0", !huginnWindow.browserFullscreen && "top-6")}
                                 style={{ viewTransitionName: "start" }}
                              >
                                 <StartBackground />
                                 <Outlet />
                              </div>
                              {/* <ReactQueryDevtools initialIsOpen={false} buttonPosition="top-right" /> */}
                              <ModalsRenderer />
                              <ContextMenusRenderer />
                              <PopoverRenderer />
                           </div>
                        </div>
                     </InsetProvider>
                  </PopoverProvider>
               </ContextMenuProvider>
            </KeybindsProvider>
         </SettingsProvider>
      </QueryClientProvider>
   );
}
