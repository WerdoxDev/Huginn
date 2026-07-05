import clsx from "clsx";
import { useEffect, useState } from "react";

import type { StatusType } from "@/types";

const STATUS_TEXT_COLORS: Record<StatusType, string> = {
   none: "",
   default: "text-text/80",
   error: "text-negative-300",
   success: "text-positive-300",
};

export default function StatusMessage(props: { className?: string; status: StatusType; visible: boolean; text: string }) {
   const [displayText, setDisplayText] = useState(props.text);
   const [displayStatus, setDisplayStatus] = useState(props.status);

   // Keep the last non-empty text to show during exit animation
   useEffect(() => {
      if (props.text) {
         setDisplayText(props.text);
         setDisplayStatus(props.status);
      }
   }, [props.text, props.status]);

   const textColor = STATUS_TEXT_COLORS[displayStatus];

   return (
      <div
         className={clsx(
            "grid transition-[grid-template-rows_margin] duration-150 ease-in-out select-none",
            props.visible && "mt-1",
            props.className,
         )}
         style={{ gridTemplateRows: props.visible ? "1fr" : "0fr" }}
      >
         <div className="min-h-0 overflow-hidden">
            <div className={clsx("text-sm transition-opacity duration-150", textColor, props.visible ? "opacity-90" : "opacity-0")}>
               {displayText}
            </div>
         </div>
      </div>
   );
}
