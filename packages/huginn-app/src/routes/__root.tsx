import { ThemeProvider } from "@stores/themeStore";
import { initializeWindow } from "@stores/windowStore";
import { createRootRoute, Outlet } from "@tanstack/react-router";
import { useEffect, useState } from "react";

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
      loaded && (
         <ThemeProvider>
            <Outlet />
         </ThemeProvider>
      )
   );
}
