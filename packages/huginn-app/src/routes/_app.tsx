import ContextMenusRenderer from "@components/contextmenu/ContextMenusRenderer";
import ModalsRenderer from "@components/modal/ModalsRenderer";
import StartBackground from "@components/StartBackgroundSvg";
import TitleBar from "@components/TitleBar";
import KeybindsProvider from "@contexts/KeybindsProvider";
import { NotificationProvider } from "@contexts/NotificationContext";
import SettingsProvider from "@contexts/SettingsProvider";
import { useInitDeviceStore } from "@hooks/initializers/useInitDeviceStore";
import { useInitPresenceStore } from "@hooks/initializers/useInitPresenceStore";
import { useInitReadStateStore } from "@hooks/initializers/useInitReadStateStore";
import { useInitStorageStore } from "@hooks/initializers/useInitStorageStore";
import { useInitTypingStore } from "@hooks/initializers/useInitTypingStore";
import { useInitUserStore } from "@hooks/initializers/useInitUserStore";
import { useInitVoiceStore } from "@hooks/initializers/useInitVoiceStore";
import { ContextMenuProvider } from "@stores/contextMenuStore";
import { ThemeProvider } from "@stores/themeStore";
import { useHuginnWindow } from "@stores/windowStore";
import { QueryClientProvider } from "@tanstack/react-query";
import { createFileRoute, Outlet } from "@tanstack/react-router";
import clsx from "clsx";

import { queryClient } from "@/lib/queries";

export const Route = createFileRoute("/_app")({ component: AppLayoutComponent });

function AppLayoutComponent() {
   const huginnWindow = useHuginnWindow();

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
                  <NotificationProvider>
                     <ThemeProvider>
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
                           </div>
                        </div>
                     </ThemeProvider>
                  </NotificationProvider>
               </ContextMenuProvider>
            </KeybindsProvider>
         </SettingsProvider>
      </QueryClientProvider>
   );
}
