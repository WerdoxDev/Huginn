import { HistoryProvider } from "@contexts/historyContext";
import { initializeFiles } from "@stores/filesStore";
import { ThemeProvider } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/query-core";
import { Outlet } from "react-router";

export const queryClient = new QueryClient({
   defaultOptions: {
      queries: {
         refetchOnReconnect: false,
         refetchOnWindowFocus: false,
         refetchOnMount: false,
         staleTime: 60000,
      },
   },
});

export default function Root() {
   const [loaded, setLoaded] = useState(false);

   useEffect(() => {
      let cancelled = false;
      let unlisten: Promise<() => void>;
      initializeFiles().then(() => {
         if (cancelled) {
            return;
         }
         // unlisten2 = initializeClient();
         unlisten = initializeWindow().then((x) => {
            setLoaded(true);
            return x;
         });
      });

      return () => {
         cancelled = true;
         unlisten?.then((f) => f());
      };
   }, []);
   return (
      // <PostHogProvider client={posthogClient}>
      <HistoryProvider>
         {loaded && (
            <ThemeProvider>
               <Outlet />
            </ThemeProvider>
         )}
      </HistoryProvider>
      // </PostHogProvider>
   );
}
