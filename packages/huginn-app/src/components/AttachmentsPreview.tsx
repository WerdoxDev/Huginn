import { Transition } from "@headlessui/react";
import { useIsMobile } from "@hooks/useIsMobile";
import { type Variants } from "motion/react";

import type { AppAttachment } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function AttachmentsPreview(props: { attachments: AppAttachment[]; onRemove: (key: string) => void }) {
   const variants: Variants = {
      visible: (i) => ({
         scale: 1,
         opacity: 1,
         transition: { type: "spring", bounce: 0.2, delay: i * 0.1 },
      }),
      hidden: { scale: 0, opacity: 0 },
      exit: { opacity: 0, transition: { duration: 0.2 } },
   };
   const isMobile = useIsMobile();

   return (
      <Transition show={props.attachments.length !== 0}>
         <div
            className="data border-surface overflow-hidden border-b px-2 pb-0 duration-150 data-closed:h-0 data-closed:border-b-0 data-closed:py-0 data-closed:opacity-0"
            data-ignore-swipe
         >
            <div className="relative flex h-full gap-x-5 overflow-x-scroll overflow-y-hidden px-1.5 py-3.5 pb-0">
               {props.attachments.map((x) => (
                  <div key={x.key} className="bg-surface relative flex aspect-square w-20 shrink-0 flex-col gap-y-2 rounded-lg p-1 lg:w-40 lg:p-2">
                     <div className="bg-surface absolute -top-2.5 -right-2.5 h-7 overflow-hidden rounded-md shadow-md">
                        {/* <Tooltip>
                           <Tooltip.Trigger className="hover:bg-surface-alt/50 p-1.5">
                              <IconMingcuteEdit2Fill className="text-text size-5" />
                           </Tooltip.Trigger>
                           <Tooltip.Content>Edit</Tooltip.Content>
                        </Tooltip> */}
                        <Tooltip>
                           <Tooltip.Trigger className="hover:bg-surface-alt/50 p-1" onClick={() => props.onRemove(x.key)}>
                              <IconMingcuteCloseFill className="text-negative-100 size-5" />
                           </Tooltip.Trigger>
                           <Tooltip.Content>Delete</Tooltip.Content>
                        </Tooltip>
                     </div>
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
         </div>
      </Transition>
   );
}
