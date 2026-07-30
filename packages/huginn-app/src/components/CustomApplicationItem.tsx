import moment from "moment";
import { useState } from "react";

import type { CustomApplication } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function CustomApplicationItem(props: {
   application: CustomApplication;
   onDelete?: (exePath: string) => void;
   onTitleChanged?: (exePath: string, title: string) => void;
}) {
   const [title, setTitle] = useState(props.application.title);

   function onFocus() {
      setTitle(props.application.title);
   }

   function onBlur() {
      if (!title) {
         setTitle(props.application.title);
         return;
      }

      if (props.application.title !== title) {
         props.onTitleChanged?.(props.application.exePath, title);
      }
   }

   return (
      <div className="flex items-center gap-x-2" key={props.application.exePath}>
         <div className="flex w-full flex-col overflow-hidden">
            <input
               className="hover:bg-surface focus:bg-surface overflow-hidden rounded-md px-1 py-0.5 text-ellipsis whitespace-nowrap text-white outline-none"
               onFocus={onFocus}
               onBlur={onBlur}
               value={title}
               onChange={(e) => setTitle(e.currentTarget.value)}
            />
            <div className="ml-1 overflow-hidden text-sm text-ellipsis whitespace-nowrap text-white/50">{props.application.exePath}</div>
            {props.application.lastOpened && (
               <div className="mt-1 ml-auto text-white/50">
                  Last opened: <span className="font-semibold">{moment.duration(props.application.lastOpened).humanize()} ago</span>
               </div>
            )}
         </div>
         <div className="ml-auto shrink-0">
            <Tooltip>
               <Tooltip.Trigger
                  onClick={() => props.onDelete?.(props.application.exePath)}
                  className="group bg-surface hover:bg-negative-500 cursor-pointer rounded-md p-1"
               >
                  <IconMingcuteDelete3Fill className="text-negative-500 group-hover:text-white" />
               </Tooltip.Trigger>
               <Tooltip.Content>Delete</Tooltip.Content>
            </Tooltip>
         </div>
      </div>
   );
}
