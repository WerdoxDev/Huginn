import GuildsBar from "@components/GuildsBar";
import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { useStartBackground } from "@stores/startBackgroundStore";
import { useModals } from "@stores/modalsStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect } from "react";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { clientStore } from "@stores/clientStore";

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
   const authBackground = useStartBackground();
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();
   // const isTransitioning = useViewTransitionState("*");

   // useEffect(() => {
   //    // updateModals({ news: { isOpen: true } });

   //    const version = localStorage.getItem("version");
   //    if (version && !isTransitioning && huginnWindow.version !== version) {
   //       updateModals({ news: { isOpen: true } });
   //       localStorage.setItem("version", huginnWindow.version);
   //    } else if (!version) {
   //       localStorage.setItem("version", huginnWindow.version);
   //    }
   // }, [isTransitioning]);

   useEffect(() => {
      authBackground.setState(2);
   }, []);

   return (
      <div className="absolute inset-0 overflow-hidden" style={{ viewTransitionName: "main" }}>
         <WebsocketProviders>
            <Outlet />
         </WebsocketProviders>
      </div>
   );
}
