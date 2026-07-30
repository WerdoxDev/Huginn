import { ActivityType } from "@huginnjs/shared";
import clsx from "clsx";

import type { AppPresence } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function ActivityPreview(props: { presence?: AppPresence; className?: string }) {
   const targetActivity = props.presence?.activities?.[0];
   // const url = useMemo(
   //    () => (targetActivity?.iconUrl ? changeUrlBase(targetActivity.iconUrl, `${settings.cdnHostname}/cdn`) : undefined),
   //    [props.presence],
   // );

   if (!targetActivity) {
      return;
   }

   return (
      <div className={clsx("text-xs text-white", props.className)}>
         {targetActivity.type === ActivityType.PLAYING && (
            <Tooltip>
               <Tooltip.Trigger className="flex w-full items-center gap-x-1">
                  {targetActivity.iconUrl ? (
                     <img src={targetActivity.iconUrl} className="size-4" />
                  ) : (
                     <IconMingcuteGame2Fill className="text-positive-300 size-4 shrink-0" />
                  )}
                  <div className="overflow-hidden text-nowrap text-ellipsis">
                     Playing <span className="font-semibold">{targetActivity.name}</span>
                  </div>
               </Tooltip.Trigger>
               <Tooltip.Content className="flex items-center justify-center gap-x-2">
                  {targetActivity.iconUrl ? (
                     <img src={targetActivity.iconUrl} className="size-4" />
                  ) : (
                     <IconMingcuteGame2Fill className="text-positive-300 size-4 shrink-0" />
                  )}
                  <div className="overflow-hidden text-nowrap text-ellipsis">
                     Playing <span className="font-semibold">{targetActivity.name}</span>
                  </div>
               </Tooltip.Content>
            </Tooltip>
         )}
      </div>
   );
}
