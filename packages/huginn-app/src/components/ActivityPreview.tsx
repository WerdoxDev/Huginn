import type { AppPresence } from "@/types";
import { ActivityType, changeUrlBase } from "@huginn/shared";
import clsx from "clsx";
import Tooltip from "./tooltip/Tooltip";
import { useFilesStore } from "@stores/filesStore";
import { useMemo } from "react";

export default function ActivityPreview(props: { presence?: AppPresence; className?: string }) {
   const { settings } = useFilesStore();
   const targetActivity = props.presence?.activities?.[0];
   const url = useMemo(
      () => (targetActivity?.iconUrl ? changeUrlBase(targetActivity.iconUrl, `${settings.cdnHostname}/cdn`) : undefined),
      [props.presence],
   );

   if (!targetActivity) {
      return;
   }

   return (
      <div className={clsx("text-xs text-white", props.className)}>
         {targetActivity.type === ActivityType.PLAYING && (
            <Tooltip>
               <Tooltip.Trigger className="flex w-full items-center gap-x-1">
                  {url ? <img src={url} className="size-4" /> : <IconMingcuteGame2Fill className="text-positive-100 size-4 shrink-0" />}
                  <div className="overflow-hidden text-ellipsis text-nowrap">
                     Playing <span className="font-bold">{targetActivity.name}</span>
                  </div>
               </Tooltip.Trigger>
               <Tooltip.Content className="flex items-center justify-center gap-x-1">
                  {url ? <img src={url} className="size-4" /> : <IconMingcuteGame2Fill className="text-positive-100 size-4 shrink-0" />}
                  <div className="overflow-hidden text-ellipsis text-nowrap">
                     Playing <span className="font-bold">{targetActivity.name}</span>
                  </div>
               </Tooltip.Content>
            </Tooltip>
         )}
      </div>
   );
}
