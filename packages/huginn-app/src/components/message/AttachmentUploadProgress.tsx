import Tooltip from "@components/tooltip/Tooltip";
import { getSizeText } from "@lib/utils";

import type { UploadProgress } from "@/types";

export default function AttachmentUploadProgress(props: { progress: UploadProgress }) {
   return (
      <div className="bg-surface-alt my-1 flex max-w-[24rem] items-center gap-x-2 rounded-lg px-2 py-3">
         <IconMingcuteFileFill className="size-10 shrink-0 text-white/50" />
         <div className="flex w-full flex-col justify-center gap-y-2 overflow-hidden">
            <div className="flex gap-x-1">
               <div className="w-full overflow-hidden text-sm text-ellipsis whitespace-nowrap text-white">
                  {props.progress.percentage === 100 ? (
                     <span className="italic">Processing...</span>
                  ) : props.progress.filenames?.length === 1 ? (
                     `Uploading ${props.progress.filenames[0]}`
                  ) : (
                     `Uploading ${props.progress.filenames?.length} files`
                  )}{" "}
               </div>
               {props.progress.percentage !== 100 && (
                  <div className="shrink-0 text-sm text-white/50">
                     <span className="text-white">-</span> {getSizeText(props.progress.total)}
                  </div>
               )}
            </div>
            <div className="bg-surface-deep h-2 w-full overflow-hidden rounded-full">
               <div style={{ width: `${props.progress.percentage}%` }} className="bg-primary-400 h-full transition-[width]" />
            </div>
         </div>
         <Tooltip>
            <Tooltip.Trigger className="mx-2" onClick={props.progress.onAbort}>
               <IconMingcuteCloseFill className="size-6 text-white/50 transition-colors duration-100 hover:text-white" />
            </Tooltip.Trigger>
            <Tooltip.Content>Cancel</Tooltip.Content>
         </Tooltip>
      </div>
   );
}
