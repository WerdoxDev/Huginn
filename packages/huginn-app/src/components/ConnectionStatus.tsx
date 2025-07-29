import type { GatewayStatus } from "@huginn/shared";
import { useClientStore } from "@stores/clientStore";
import clsx from "clsx";

const statusTexts: Record<GatewayStatus, string> = {
   connected: "Connected - Not Authenticated",
   authenticated: "Connected - Authenticated",
   connecting: "Connecting",
   reconnecting: "Reconnecting",
   disconnected: "Disconnected",
   none: "Connecting...",
};

export default function ConnectionStatus() {
   const clientStore = useClientStore();

   const { gatewayStatus } = useClientStore();

   return (
      <div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
         <div
            className={clsx(
               "h-2 w-2 rounded-full",
               gatewayStatus === "authenticated" && "bg-positive-100",
               (gatewayStatus === "disconnected" || gatewayStatus === "reconnecting") && "bg-negative-100",
               (gatewayStatus === "reconnecting" || gatewayStatus === "connecting" || gatewayStatus === "none" || !clientStore.isInitialized) &&
                  "bg-caution-100",
               gatewayStatus === "connected" && "bg-positive-400",
            )}
         />
         <span className="text-text/80 text-xs font-medium uppercase">{gatewayStatus ? statusTexts[gatewayStatus] : "Not Initialized"}</span>
         {clientStore.isInitialized && (gatewayStatus === "connecting" || gatewayStatus === "reconnecting") && (
            <span className="text-text/80 text-xs font-medium uppercase">via {clientStore.hostnames.api}</span>
         )}
      </div>
   );
}
