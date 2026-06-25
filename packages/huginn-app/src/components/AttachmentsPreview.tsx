import { useIsMobile } from "@hooks/useIsMobile";
import { AnimatePresence, motion } from "motion/react";

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
               animate={{ opacity: 1, height: isMobile ? 108 : 220, borderBottomWidth: 1 }}
               exit={{ opacity: 0, height: 0, borderBottomWidth: 0 }}
               transition={{ duration: 0.15 }}
               style={{ willChange: "height" }}
            >
               <div className="relative flex h-full gap-x-5 overflow-x-scroll overflow-y-hidden px-1.5 py-3.5 pb-0">
                  {props.attachments.map((x) => (
                     <div key={x.key} className="lg:bg-surface relative flex aspect-square w-20 shrink-0 flex-col gap-y-2 rounded-lg lg:w-40 lg:p-2">
                        {!isMobile ? (
                           <div className="border-surface-alt absolute -top-1.5 -right-2.5 flex shrink-0 items-center justify-center overflow-hidden rounded-lg border-2">
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
                                    onClick={() => props.onRemove(x.key)}
                                 >
                                    <IconMingcuteCloseFill className="text-negative-300 h-full w-full" />
                                 </Tooltip.Trigger>
                                 <Tooltip.Content>Delete</Tooltip.Content>
                              </Tooltip>
                           </div>
                        ) : (
                           <div className="border-surface-alt absolute -top-1.5 -right-1.5 flex shrink-0 items-center justify-center overflow-hidden rounded-full border-2">
                              <button
                                 className="hover:bg-surface-deep active:bg-surface-deep bg-surface flex size-6 items-center justify-center p-1"
                                 onClick={() => props.onRemove(x.key)}
                              >
                                 <IconMingcuteCloseFill className="text-negative-300 h-full w-full" />
                              </button>
                           </div>
                        )}
                        <div className="bg-surface-alt flex h-full min-h-0 items-center justify-center overflow-hidden rounded-sm">
                           {x.previewDataUrl ? (
                              <img className="h-full w-full object-cover lg:object-contain" loading="lazy" src={x.previewDataUrl} alt={x.filename} />
                           ) : (
                              <IconMingcuteFileFill className="text-text size-20" />
                           )}
                        </div>
                        {!isMobile && <div className="shrink-0 truncate text-white">{x.filename}</div>}
                     </div>
                  ))}
               </div>
            </motion.div>
         )}
      </AnimatePresence>
   );
}
