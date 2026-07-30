import type { Snowflake } from "@huginnjs/shared";

import { useRef, useState, useLayoutEffect } from "react";

import type { ProcessedMessage } from "@/types";

export function useMessageWidths(options: {
   idPrefix?: string;
   message: ProcessedMessage;
   lastMessage?: ProcessedMessage;
   nextMessage?: ProcessedMessage;
}) {
   const rootRef = useRef<HTMLDivElement>(null);
   const extrasRef = useRef<HTMLDivElement>(null);
   const reactionsRef = useRef<HTMLDivElement>(null);
   const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number; reactionsWidth: number }>({
      width: 0,
      lastWidth: 0,
      nextWidth: 0,
      reactionsWidth: 0,
   });

   useLayoutEffect(() => {
      function getMaxChildWidth(messageId?: Snowflake) {
         if (!messageId) return 0;

         const inner = document.getElementById(`${(options.idPrefix ?? "") + messageId}_inner`);
         if (!inner) return 0;

         let maxWidth = 0;
         for (const child of Array.from(inner.children)) {
            maxWidth = Math.max(maxWidth, (child as HTMLElement).clientWidth || 0);
         }

         return maxWidth;
      }

      function updateWidths() {
         const width = getMaxChildWidth(options.message.id);
         const lastWidth = getMaxChildWidth(options.lastMessage?.id);
         const nextWidth = getMaxChildWidth(options.nextMessage?.id);
         const reactionsWidth = reactionsRef.current?.clientWidth ?? 0;

         setWidths({ width, lastWidth, nextWidth, reactionsWidth });
      }

      updateWidths();

      const root = rootRef.current;
      if (!root || typeof ResizeObserver === "undefined") {
         return;
      }

      const observer = new ResizeObserver(() => requestAnimationFrame(() => updateWidths()));
      observer.observe(root);

      const extrasObserver = new ResizeObserver(() => requestAnimationFrame(() => updateWidths()));
      if (extrasRef.current) {
         extrasObserver.observe(extrasRef.current);
      }

      const reactionsObserver = new ResizeObserver(() => requestAnimationFrame(() => updateWidths()));
      if (reactionsRef.current) {
         reactionsObserver.observe(reactionsRef.current);
      }

      return () => {
         observer.disconnect();
         extrasObserver.disconnect();
         reactionsObserver.disconnect();
      };
   }, [options.message, options.lastMessage, options.nextMessage]);

   return { rootRef, extrasRef, reactionsRef, widths };
}
