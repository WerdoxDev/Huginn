import { HistoryProvider } from "@contexts/historyContext";
import { ThemeProvider } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
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
      const unlisten = initializeWindow().then((x) => {
         setLoaded(true);
         return x;
      });

      return () => {
         unlisten?.then((f) => f());
      };
   }, []);
   return (
      <HistoryProvider>
         {loaded && (
            <ThemeProvider>
               <Outlet />
            </ThemeProvider>
         )}
      </HistoryProvider>
   );
}
