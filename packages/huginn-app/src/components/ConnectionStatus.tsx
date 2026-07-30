import type { GatewayStatus } from "@huginn/shared";

import { useClientStore } from "@stores/clientStore";
import clsx from "clsx";

const statuses: Record<GatewayStatus, { text: string; color?: string }> = {
   connected: { text: "Connected - Not Authenticated", color: "bg-caution-300" },
   authenticated: { text: "Connected - Authenticated", color: "bg-positive-300" },
   connecting: { text: "Connecting", color: "bg-caution-300" },
   disconnected: { text: "Disconnected", color: "bg-negative-300" },
   helloed: { text: "Connected - Not Authenticated", color: "bg-caution-300" },
   idle: { text: "Not Initialized", color: "bg-caution-300" },
};

export default function ConnectionStatus() {
   const clientStore = useClientStore();

   const { gatewayStatus } = useClientStore();

   return (
      <div className="pointer-events-none ml-2 flex items-center justify-center gap-x-2">
         <div className={clsx("h-2 w-2 rounded-full", statuses[gatewayStatus ?? "idle"].color)} />
         <span className="text-text/80 box-exact text-xs font-medium uppercase">
            {gatewayStatus ? statuses[gatewayStatus].text : statuses["idle"].text}
         </span>
         {clientStore.isInitialized && gatewayStatus === "connecting" && (
            <span className="text-text/80 text-xs font-medium uppercase">via {clientStore.hostnames.api}</span>
         )}
      </div>
   );
}
