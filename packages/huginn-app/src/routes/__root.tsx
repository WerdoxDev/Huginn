import { HistoryProvider } from "@contexts/HistoryContext";
import { ThemeProvider } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { useEffect, useState } from "react";
import { QueryClient } from "@tanstack/react-query";
import { createRootRoute, Outlet } from "@tanstack/react-router";

export const Route = createRootRoute({
   component: RootComponent,
});

function RootComponent() {
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
