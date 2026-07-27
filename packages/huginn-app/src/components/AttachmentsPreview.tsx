import { useIsMobile } from "@hooks/useIsMobile";
import { CONSTANTS, isAudioMediaType, isImageMediaType, isVideoMediaType } from "@huginn/shared";
import { clsx } from "clsx";
import { AnimatePresence, motion } from "motion/react";
import { useMemo } from "react";

import type { AppAttachment } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function AttachmentsPreview(props: { attachments: AppAttachment[]; onRemove: (key: string) => void }) {
   const isMobile = useIsMobile();

   return (
      // <Transition show={props.attachments.length !== 0}>
      <AnimatePresence>
         {props.attachments.length !== 0 && (
            <motion.div
               className="border-surface overflow-hidden px-2 pb-0"
               data-ignore-swipe
               initial={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
               animate={{ opacity: 1, height: isMobile ? "calc(6rem + 1px)" : "calc(13rem + 1px)", borderBottomWidth: 1 }}
               exit={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
               transition={{ duration: 0.15, ease: [0.4, 0, 0.2, 1] }}
               style={{ willChange: "height" }}
            >
               <div className="relative flex h-full gap-x-5 overflow-x-scroll overflow-y-hidden px-1 py-3 pb-0">
                  {props.attachments.map((x) => (
                     <AttachmentItem key={x.key} attachment={x} onRemove={props.onRemove} />
                  ))}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}

function AttachmentItem(props: { attachment: AppAttachment; onRemove: (key: string) => void }) {
   const isMobile = useIsMobile();

   const isAudio = isAudioMediaType(props.attachment.contentType);
   const isVideo = isVideoMediaType(props.attachment.contentType);
   const isImage = isImageMediaType(props.attachment.contentType);
   const thumbnailOnly = isVideo || isImage;

   return (
      <div
         key={props.attachment.key}
         className={clsx("relative shrink-0 gap-y-2 lg:w-40 lg:flex-col", isMobile && thumbnailOnly ? "w-18" : "max-w-3xs")}
      >
         {!isMobile ? (
            <div className="border-surface-alt absolute -top-2.5 -right-2.5 z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border-2">
               <Tooltip>
                  <Tooltip.Trigger className="hover:bg-surface-deep bg-surface flex size-7 items-center justify-center p-1">
                     <IconMingcuteEdit2Fill className="text-text h-full w-full" />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Edit</Tooltip.Content>
               </Tooltip>
               <div className="bg-surface-alt h-7 w-0.5" />
               <Tooltip>
                  <Tooltip.Trigger
                     className="hover:bg-surface-deep bg-surface flex size-7 items-center justify-center p-1"
                     onClick={() => props.onRemove(props.attachment.key)}
                  >
                     <IconMingcuteCloseFill className="text-negative-300 h-full w-full" />
                  </Tooltip.Trigger>
                  <Tooltip.Content>Delete</Tooltip.Content>
               </Tooltip>
            </div>
         ) : (
            <div className="border-surface-alt absolute -top-2.5 -right-2.5 z-10 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border-2">
               <button
                  className="hover:bg-surface-deep active:bg-surface-deep bg-surface flex size-6 cursor-pointer items-center justify-center p-1"
                  onClick={() => props.onRemove(props.attachment.key)}
               >
                  <IconMingcuteCloseFill className="text-negative-300 h-full w-full" />
               </button>
            </div>
         )}
         <div className="lg:bg-surface border-surface flex h-full w-full flex-col overflow-hidden rounded-lg border-2">
            <div
               className={clsx(
                  "bg-surface-deep relative flex h-full min-h-0 w-full items-center justify-center gap-x-2 overflow-hidden",
                  isMobile && !thumbnailOnly && "pr-4 pl-2",
               )}
            >
               {props.attachment.previewDataUrl ? (
                  <img
                     className="h-full w-full object-cover lg:object-contain"
                     loading="lazy"
                     src={props.attachment.previewDataUrl}
                     alt={props.attachment.filename}
                  />
               ) : isVideo ? (
                  <IconMingcuteVideoFill className="text-text size-12 shrink-0 lg:size-20" />
               ) : isAudio ? (
                  <IconMingcuteFileMusicFill className="text-text size-12 shrink-0 lg:size-20" />
               ) : (
                  <IconMingcuteFileFill className="text-text size-12 shrink-0 lg:size-20" />
               )}
               {props.attachment.previewDataUrl && isVideo && (
                  <div className="absolute bottom-1 left-1 rounded-md bg-black/80 p-1">
                     <IconMingcuteVideoFill className="text-text size-5" />
                  </div>
               )}
               {isMobile && !thumbnailOnly && (
                  <div className="flex flex-col overflow-hidden">
                     <div className="truncate text-sm text-white">{props.attachment.filename}</div>
                     <div className="text-xs text-white/60">{props.attachment.filename.split(".").at(-1)?.toUpperCase()} File</div>
                  </div>
               )}
            </div>
            {!isMobile && (
               <div className="bg-surface-deep flex shrink-0 flex-col overflow-hidden p-2">
                  <div className="truncate text-white">{props.attachment.filename}</div>
                  <div className="text-sm text-white/60">{props.attachment.filename.split(".").at(-1)?.toUpperCase()} File</div>
               </div>
            )}
            {/* <div className="shrink-0 truncate text-white">{props.attachment.filename}</div> */}
         </div>
      </div>
   );
}
