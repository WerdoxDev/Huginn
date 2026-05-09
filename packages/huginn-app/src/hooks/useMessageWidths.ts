import type { Snowflake } from "@huginn/shared";

import { useRef, useState, useLayoutEffect } from "react";

import type { ProcessedMessage } from "@/types";

export function useMessageWidths(params: { message: ProcessedMessage; lastMessage?: ProcessedMessage; nextMessage?: ProcessedMessage }) {
   const { message, lastMessage, nextMessage } = params;
   const rootRef = useRef<HTMLDivElement>(null);
   const extrasRef = useRef<HTMLDivElement>(null);
   const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number }>({
      width: 0,
      lastWidth: 0,
      nextWidth: 0,
   });

   useLayoutEffect(() => {
      function getMaxChildWidth(messageId?: Snowflake) {
         if (!messageId) return 0;

         const inner = document.getElementById(`${messageId}_inner`);
         if (!inner) return 0;

         let maxWidth = 0;
         for (const child of Array.from(inner.children)) {
            maxWidth = Math.max(maxWidth, (child as HTMLElement).clientWidth || 0);
         }

         return maxWidth;
      }

      function updateWidths() {
         const width = getMaxChildWidth(message.id);
         const lastWidth = getMaxChildWidth(lastMessage?.id);
         const nextWidth = getMaxChildWidth(nextMessage?.id);

         setWidths({ width, lastWidth, nextWidth });
      }

      updateWidths();

      const root = rootRef.current;
      if (!root || typeof ResizeObserver === "undefined") {
         return;
      }

      const observer = new ResizeObserver(() => updateWidths());
      observer.observe(root);

      const extrasObserver = new ResizeObserver(() => updateWidths());
      if (extrasRef.current) {
         extrasObserver.observe(extrasRef.current);
      }

      return () => {
         observer.disconnect();
         extrasObserver.disconnect();
      };
   }, [message, lastMessage, nextMessage]);

   return { rootRef, extrasRef, widths };
}
