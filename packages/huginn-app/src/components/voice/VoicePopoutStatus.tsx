import Tooltip from "@components/tooltip/Tooltip";
import { useIsMobile } from "@hooks/useIsMobile";
import { useVoiceStatus } from "@hooks/useVoiceStatus";
import { clsx } from "clsx";

export default function VoicePopoutStatus() {
   const { rtt, latencyColor, statuses, voiceStatus } = useVoiceStatus();
   const isMobile = useIsMobile();

   if (voiceStatus === "idle") return null;

   return (
      <Tooltip>
         {voiceStatus !== "ready" ? (
            <IconMingcuteWifiOffLine className={clsx("size-7 shrink-0", statuses[voiceStatus ?? "idle"].color)} />
         ) : (
            <Tooltip.Trigger className="flex cursor-default items-center gap-x-2">
               <IconMingcuteWifiLine className="text-positive-100 size-7 shrink-0 transition-colors" style={{ color: latencyColor }} />
               {isMobile && (
                  <div className="text-sm" style={{ color: latencyColor }}>
                     {rtt} ms
                  </div>
               )}
            </Tooltip.Trigger>
         )}
         <Tooltip.Content extraStyle={{ color: latencyColor }}>{rtt} ms</Tooltip.Content>
      </Tooltip>
   );
}
