import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { clientStore } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/_main")({
   component: MainLayoutComponent,
   beforeLoad: ({ location }) => {
      const client = clientStore.getState().client;
      if (!client || client?.gateway.status !== "authenticated") {
         sessionStorage.setItem("redirect", JSON.stringify({ pathname: location.pathname, requiresAuth: true }));
         throw redirect({ to: "/" });
      }
   },
});

function MainLayoutComponent() {
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();
   // const isTransitioning = useViewTransitionState("*");

   useEffect(() => {
      const lastVersion = localStorage.getItem("last-version") ?? undefined;
      if (huginnWindow.version !== lastVersion) {
         setTimeout(() => {
            updateModals({ news: { isOpen: true, lastVersion } });
         }, 1000);
         localStorage.setItem("last-version", huginnWindow.version);
      }
   }, []);

   return (
      <div className="absolute inset-0 overflow-hidden" style={{ viewTransitionName: "main" }}>
         <WebsocketProviders>
            <Outlet />
         </WebsocketProviders>
      </div>
   );
}
