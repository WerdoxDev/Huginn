import type { ReactNode } from "react";

import HuginnLabel from "@components/HuginnLabel";

export function ProfileAboutMe(props: { accentColor: string; headerRight?: ReactNode; children: ReactNode }) {
   return (
      <div className="bg-surface rounded-md px-3 py-2.5" style={{ borderColor: props.accentColor }}>
         <div className="mb-1 flex items-center justify-between">
            <HuginnLabel className="text-tiny mb-0!">About Me</HuginnLabel>
            {props.headerRight}
         </div>
         <div className="wrap-anywhere">{props.children}</div>
      </div>
   );
}

export function ProfileActivity(props: { type: string; name: string; iconUrl?: string | null; elapsedText?: string; accentColor: string }) {
   return (
      <div className="bg-surface rounded-md p-3" style={{ borderColor: props.accentColor }}>
         <HuginnLabel className="text-tiny">{props.type}</HuginnLabel>
         <div className="flex items-center gap-x-3">
            {props.iconUrl ? (
               <img src={props.iconUrl} className="size-10 rounded-lg" alt={props.name} />
            ) : (
               <div className="flex size-10 items-center justify-center rounded-lg" style={{ backgroundColor: `${props.accentColor}33` }}>
                  <IconMingcuteGame2Fill className="size-5" style={{ color: props.accentColor }} />
               </div>
            )}
            <div className="flex min-w-0 flex-col">
               <span className="truncate text-sm font-semibold text-white">{props.name}</span>
               {props.elapsedText && <span className="text-text text-xs">{props.elapsedText} elapsed</span>}
            </div>
         </div>
      </div>
   );
}
