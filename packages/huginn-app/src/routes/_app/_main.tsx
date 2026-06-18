import WebsocketProviders from "@components/websocket/WebsocketProviders";
import { clientStore } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { Outlet, createFileRoute, redirect } from "@tanstack/react-router";
import { useEffect } from "react";

export const Route = createFileRoute("/_app/_main")({
   component: MainLayoutComponent,
   beforeLoad: ({ location }) => {
      const client = clientStore.getState().client;
      if (!client || client?.gateway.status !== "authenticated") {
         console.log("NOT AUTHENTICATED");
         sessionStorage.setItem("redirect", JSON.stringify({ pathname: location.pathname, requiresAuth: true }));
         throw redirect({ to: "/" });
      }
   },
});

function MainLayoutComponent() {
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();
   const clientInfo = useStorage("client-info");
   const { setValue } = useStorageStore();

   useEffect(() => {
      const lastVersion = clientInfo?.lastVersion ?? undefined;
      if (huginnWindow.version !== lastVersion) {
         setTimeout(() => {
            updateModals({ news: { isOpen: true, lastVersion } });
         }, 1000);
         setValue("client-info", { ...clientInfo, lastVersion: huginnWindow.version });
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
