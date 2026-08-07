import Tooltip from "@components/tooltip/Tooltip";
import { useVoiceStatus } from "@hooks/useVoiceStatus";
import { clsx } from "clsx";

export default function VoicePopoutStatus() {
   const { rtt, latencyColor, statuses, voiceStatus } = useVoiceStatus();

   if (voiceStatus === "idle") return null;

   return (
      <div className="absolute bottom-2.5 left-2.5 z-20 size-7">
         <Tooltip>
            {voiceStatus !== "ready" ? (
               <IconMingcuteWifiOffLine className={clsx("size-7", statuses[voiceStatus ?? "idle"].color)} />
            ) : (
               <Tooltip.Trigger className="cursor-default">
                  <IconMingcuteWifiLine className="text-positive-100 size-7 transition-colors" style={{ color: latencyColor }} />
               </Tooltip.Trigger>
            )}
            <Tooltip.Content extraStyle={{ color: latencyColor }}>{rtt} ms</Tooltip.Content>
         </Tooltip>
      </div>
   );
}
