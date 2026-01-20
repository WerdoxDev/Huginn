import { useEffect, useRef, useState } from "react";
import type { StatusType } from "@/types";
import clsx from "clsx";

const STATUS_TEXT_COLORS: Record<StatusType, string> = {
   none: "",
   default: "text-text/80",
   error: "text-negative-100",
   success: "text-positive-100",
};

export default function StatusMessage(props: { className?: string; status: StatusType; visible: boolean; text: string }) {
   const textRef = useRef<HTMLDivElement>(null);
   const [height, setHeight] = useState(0);
   const [displayText, setDisplayText] = useState(props.text);
   const [displayStatus, setDisplayStatus] = useState(props.status);

   // Keep the last non-empty text to show during exit animation
   useEffect(() => {
      if (props.text) {
         setDisplayText(props.text);
         setDisplayStatus(props.status);
      }
   }, [props.text, props.status]);

   // Update height when text or visibility changes
   useEffect(() => {
      if (textRef.current) {
         setHeight(textRef.current.scrollHeight);
      }
   }, [props.text, props.visible]);

   // Use ResizeObserver for more reliable height tracking
   useEffect(() => {
      const element = textRef.current;
      if (!element) return;

      const resizeObserver = new ResizeObserver((entries) => {
         for (const entry of entries) {
            setHeight(entry.target.scrollHeight);
         }
      });

      resizeObserver.observe(element);
      return () => resizeObserver.disconnect();
   }, [displayText]);

   const textColor = STATUS_TEXT_COLORS[displayStatus];

   return (
      <div
         className={clsx("overflow-hidden transition-[height] duration-150 ease-in-out select-none", props.className)}
         style={{ height: props.visible ? `${height}px` : "0px" }}
      >
         <div ref={textRef} className={clsx("text-sm transition-opacity duration-150", textColor, props.visible ? "opacity-90" : "opacity-0")}>
            {displayText}
         </div>
      </div>
   );
}
