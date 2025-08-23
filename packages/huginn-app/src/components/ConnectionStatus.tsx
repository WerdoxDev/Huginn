import type { GatewayStatus } from "@huginn/shared";
import { useClientStore } from "@stores/clientStore";
import clsx from "clsx";

const statuses: Record<GatewayStatus, { text: string; color?: string }> = {
   connected: { text: "Connected - Not Authenticated", color: "bg-caution-100" },
   authenticated: { text: "Connected - Authenticated", color: "bg-positive-100" },
   connecting: { text: "Connecting", color: "bg-caution-100" },
   reconnecting: { text: "Reconnecting", color: "bg-negative-100" },
   disconnected: { text: "Disconnected", color: "bg-negative-100" },
   opening: { text: "Connecting...", color: "bg-caution-100" },
   none: { text: "Connecting...", color: "bg-caution-100" },
};

export default function ConnectionStatus() {
   const clientStore = useClientStore();

   const { gatewayStatus } = useClientStore();

   return (
      <div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
         <div className={clsx("h-2 w-2 rounded-full", statuses[gatewayStatus ?? "none"].color)} />
         <span className="text-text/80 text-xs font-medium uppercase">{gatewayStatus ? statuses[gatewayStatus].text : "Not Initialized"}</span>
         {clientStore.isInitialized && (gatewayStatus === "connecting" || gatewayStatus === "reconnecting") && (
            <span className="text-text/80 text-xs font-medium uppercase">via {clientStore.hostnames.api}</span>
         )}
      </div>
   );
}
