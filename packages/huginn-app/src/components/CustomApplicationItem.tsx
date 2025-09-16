import type { CustomApplication } from "@/types";
import moment from "moment";
import Tooltip from "./tooltip/Tooltip";
import { useState } from "react";

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
         <div className="flex flex-col overflow-hidden">
            <input
               className="focus:bg-surface hover:bg-surface overflow-hidden text-ellipsis whitespace-nowrap rounded-md px-1 py-0.5 text-white outline-none"
               onFocus={onFocus}
               onBlur={onBlur}
               value={title}
               onChange={(e) => setTitle(e.currentTarget.value)}
            />
            <div className="ml-1 overflow-hidden text-ellipsis whitespace-nowrap text-sm text-white/50">{props.application.exePath}</div>
            {props.application.lastOpened && (
               <div className="ml-auto mt-1 text-white/50">
                  Last opened: <span className="font-semibold">{moment.duration(props.application.lastOpened).humanize()} ago</span>
               </div>
            )}
         </div>
         <div className="ml-auto shrink-0">
            <Tooltip>
               <Tooltip.Trigger
                  onClick={() => props.onDelete?.(props.application.exePath)}
                  className="bg-negative-100/10 hover:bg-negative-400 group cursor-pointer rounded-md p-1"
               >
                  <IconMingcuteDelete3Fill className="text-negative-100 group-hover:text-white" />
               </Tooltip.Trigger>
               <Tooltip.Content>Delete</Tooltip.Content>
            </Tooltip>
         </div>
      </div>
   );
}
