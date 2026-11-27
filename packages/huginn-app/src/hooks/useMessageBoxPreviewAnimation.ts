import { type RefObject, useLayoutEffect, useRef, useState } from "react";

import type { AppAttachment } from "@/types";

import type { MessageViewportHandle } from "./useMessageViewportResize";

/** Changes geometry once; only the background and content transforms move during the transition. */
export function useMessageBoxPreviewAnimation(options: {
   attachments: AppAttachment[];
   replyingMessageId?: string;
   editing: boolean;
   channelId?: string;
   isMobile: boolean;
   messageViewportRef: RefObject<MessageViewportHandle | null>;
}) {
   const topRef = useRef<HTMLDivElement>(null);
   const backgroundRef = useRef<HTMLDivElement>(null);
   const previewRef = useRef<HTMLDivElement>(null);
   const itemsRef = useRef<HTMLDivElement>(null);
   const replying = usePreviewRefs();
   const editing = usePreviewRefs();
   const finishRef = useRef<(() => void) | null>(null);
   const previous = useRef({ channelId: options.channelId, isMobile: options.isMobile, open: false, replying: false, editing: false });
   const [retainedAttachments, setRetainedAttachments] = useState(options.attachments);
   const [retainedReplyId, setRetainedReplyId] = useState(options.replyingMessageId);
   const replyingOpen = !!options.replyingMessageId;
   const open = options.attachments.length > 0;

   // Keep the last items mounted while the preview closes.
   if (open && retainedAttachments !== options.attachments) setRetainedAttachments(options.attachments);

   if (options.replyingMessageId && retainedReplyId !== options.replyingMessageId) setRetainedReplyId(options.replyingMessageId);

   useLayoutEffect(() => {
      const top = topRef.current;
      const background = backgroundRef.current;
      const preview = previewRef.current;
      const items = itemsRef.current;
      if (!top || !background || !preview || !items) return;

      const rows = [
         { preview, items, open },
         { preview: replying.previewRef.current, items: replying.itemsRef.current, open: replyingOpen },
         { preview: editing.previewRef.current, items: editing.itemsRef.current, open: options.editing },
      ].flatMap((row) => {
         if (!row.preview || !row.items) return [];
         const clip = row.items.parentElement!;
         const style = getComputedStyle(row.items);
         return [
            {
               ...row,
               preview: row.preview,
               items: row.items,
               clip,
               top: clip.getBoundingClientRect().top,
               transform: style.transform,
               opacity: style.opacity,
            },
         ];
      });
      const before = previous.current;
      previous.current = { channelId: options.channelId, isMobile: options.isMobile, open, replying: replyingOpen, editing: options.editing };
      const animate =
         (before.open !== open || before.replying !== replyingOpen || before.editing !== options.editing) &&
         before.channelId === options.channelId &&
         before.isMobile === options.isMobile;
      const backgroundHeight = background.getBoundingClientRect().height;
      const topPosition = top.getBoundingClientRect().top;
      const updateLayout: Parameters<MessageViewportHandle["resize"]>[0] = (animate) => {
         for (const row of rows) {
            row.preview.style.height = row.open ? `${row.clip.offsetHeight}px` : "0px";
            row.items.style.transform = row.open ? "translateY(0)" : "translateY(100%)";
            row.items.style.opacity = row.open ? "1" : "0";
         }
         if (!animate) return;

         const nextBackgroundHeight = background.getBoundingClientRect().height;
         const offset = topPosition - top.getBoundingClientRect().top;
         // The rounded caps keep their shape; only the straight sides stretch.
         animate(background, [{ transform: `scaleY(${backgroundHeight / nextBackgroundHeight})` }, { transform: "scaleY(1)" }]);
         animate(top, [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }]);
         for (const row of rows) {
            // Move open rows together when a preview below them changes height.
            const offset = row.top - row.clip.getBoundingClientRect().top;
            animate(row.clip, [{ transform: `translateY(${offset}px)` }, { transform: "translateY(0)" }]);
            animate(row.items, [
               { transform: row.transform, opacity: row.opacity },
               { transform: row.items.style.transform, opacity: row.items.style.opacity },
            ]);
         }
      };
      const onFinish = () => {
         // A closing transition may be interrupted by reopening the preview.
         if (!open && !previous.current.open) setRetainedAttachments([]);
         if (!replyingOpen && !previous.current.replying) setRetainedReplyId(undefined);
      };
      if (options.messageViewportRef.current) {
         finishRef.current = options.messageViewportRef.current.resize(updateLayout, animate, onFinish);
      } else {
         updateLayout();
         onFinish();
      }
   }, [open, replyingOpen, options.editing, options.channelId, options.isMobile, options.messageViewportRef]);

   useLayoutEffect(() => () => finishRef.current?.(), []);

   return {
      topRef,
      backgroundRef,
      previewRef,
      itemsRef,
      attachments: open ? options.attachments : retainedAttachments,
      open,
      replying: { ...replying, open: replyingOpen, messageId: options.replyingMessageId ?? retainedReplyId },
      editing: { ...editing, open: options.editing },
   };
}

function usePreviewRefs() {
   const previewRef = useRef<HTMLDivElement>(null);
   const itemsRef = useRef<HTMLDivElement>(null);
   return { previewRef, itemsRef };
}
