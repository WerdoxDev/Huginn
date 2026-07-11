import type { ReactNode } from "react";

import HuginnLabel from "@components/HuginnLabel";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { type Activity, ActivityType } from "@huginn/shared";
import clsx from "clsx";

export function ProfileAboutMe(props: { accentColor: string; headerRight?: ReactNode; children: ReactNode }) {
   return (
      <div className="bg-surface rounded-md px-3 py-2.5">
         <div className="mb-1 flex items-center justify-between">
            <HuginnLabel className="text-tiny mb-0!">About Me</HuginnLabel>
            {props.headerRight}
         </div>
         <div className="wrap-anywhere">{props.children}</div>
      </div>
   );
}

function getActivityTypeLabel(type: ActivityType): string {
   return type === ActivityType.PLAYING ? "Playing a Game" : "Listening";
}

export function ProfileActivity(props: {
   activity: Pick<Activity, "type" | "name" | "iconUrl" | "startedAt">;
   accentColor: string;
   className?: string;
}) {
   const { activity } = props;
   const typeLabel = getActivityTypeLabel(activity.type);
   const { getFormattedDuration } = useElapsedTime(activity.startedAt);

   return (
      <div className={clsx("bg-surface overflow-hidden rounded-md p-3", props.className)}>
         <HuginnLabel className="text-tiny">{typeLabel}</HuginnLabel>
         <div className="flex items-center gap-x-3">
            <div
               className="flex size-14 shrink-0 items-center justify-center rounded-lg"
               style={{ backgroundColor: `color-mix(in srgb, ${props.accentColor || "white"} 20%, transparent)` }}
            >
               {activity.iconUrl ? (
                  <img src={activity.iconUrl} className="size-10 rounded-lg" alt={activity.name} />
               ) : (
                  <IconMingcuteGame2Fill className="size-7" style={{ color: props.accentColor || "white" }} />
               )}
            </div>
            <div className="flex flex-col truncate">
               <div className="truncate text-sm font-semibold text-white">{activity.name}</div>
               <div className="text-positive-300 flex items-center gap-x-1 text-xs">
                  <IconMingcuteGame2Fill />
                  <span>{getFormattedDuration()}</span>
               </div>
            </div>
         </div>
      </div>
   );
}
