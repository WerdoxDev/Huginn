import clsx from "clsx";
import { useEffect, useState } from "react";

import type { HuginnStatus } from "../types";

const statusTextColors: Record<HuginnStatus, string> = {
   none: "",
   default: "text-text/80",
   error: "text-negative-300",
   success: "text-positive-300",
};

export type StatusMessageProps = {
   className?: string;
   status: HuginnStatus;
   visible: boolean;
   text: string;
};

export default function StatusMessage({ className, status, text, visible }: StatusMessageProps) {
   const [displayText, setDisplayText] = useState(text);
   const [displayStatus, setDisplayStatus] = useState(status);

   useEffect(() => {
      if (!text) return;
      setDisplayText(text);
      setDisplayStatus(status);
   }, [text, status]);

   return (
      <div
         className={clsx("grid transition-[grid-template-rows_margin] duration-150 ease-in-out select-none", visible && "mt-1", className)}
         style={{ gridTemplateRows: visible ? "1fr" : "0fr" }}
      >
         <div className="min-h-0 overflow-hidden">
            <div className={clsx("text-sm transition-opacity duration-150", statusTextColors[displayStatus], visible ? "opacity-90" : "opacity-0")}>
               {displayText}
            </div>
         </div>
      </div>
   );
}
