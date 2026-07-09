import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import DialogActions from "@components/DialogActions";
import DialogBody from "@components/DialogBody";
import HuginnDialogTitle from "@components/HuginnDialogTitle";
import LoadingIcon from "@components/LoadingIcon";
import { useModals } from "@stores/modalsStore";
// import { voiceClient } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState, useTransition } from "react";

import type { AudioSource } from "@/types";

import HuginnDialogPanel from "./HuginnDialogPanel";

export default function StreamAudioModal() {
   const { streamAudio: modal, updateModals } = useModals();
   const { data, isFetching, isLoading, refetch } = useQuery({
      queryKey: ["audio-sources"],
      queryFn: async () => await window.electronAPI.getAudioSources(),
      enabled: modal.isOpen,
      // select: (data) => Array.from(new Map(data.map((item) => [item.processId, item])).values()),
   });

   const [selectedSource, setSelectedSource] = useState<AudioSource | undefined>();
   const [streamAudioPending, startTransition] = useTransition();

   useEffect(() => {
      if (modal.isOpen) {
         refetch();
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ streamAudio: { isOpen: false, callback: undefined } });
   }

   async function stream() {
      if (!selectedSource) {
         return;
      }

      startTransition(async () => {
         modal.callback?.(selectedSource.processId);
         close();
      });
   }

   return (
      <HuginnDialogPanel className="w-full max-w-lg select-none">
         <DialogBody>
            <HuginnDialogTitle title="Stream Audio" description="Choose an application to share its audio with others" />
            <div className="scroll-thin scroll-surface-alt border-primary-700 p flex h-72 flex-col gap-y-2 overflow-y-scroll rounded-lg border p-2.5 pr-1">
               {isLoading ? (
                  <div className="flex h-full w-full items-center justify-center">
                     <LoadingIcon className="size-16" />
                  </div>
               ) : (
                  data?.map((x) => (
                     <button
                        className={clsx(
                           "bg-surface-alt ring-primary-700 flex cursor-pointer items-start gap-x-2 rounded-md px-2 py-2 text-left transition-shadow",
                           x === selectedSource ? "ring-2" : "hover:ring-2",
                        )}
                        key={`${x.processId}-${x.name}`}
                        type="button"
                        onClick={() => setSelectedSource(x)}
                     >
                        <img src={x.appIcon} alt={x.processId} className="aspect-square size-6" />
                        <div className="text-text wrap-anywhere">{x.name}</div>
                     </button>
                  ))
               )}
            </div>
         </DialogBody>
         <DialogActions>
            <LoadingButton className="h-10 w-24" color="surface" onClick={() => refetch({})} isLoading={isFetching}>
               Refresh
            </LoadingButton>
            <HuginnButton className="ml-auto h-10 w-20 decoration-white hover:underline" onClick={close}>
               Cancel
            </HuginnButton>
            <LoadingButton
               isLoading={streamAudioPending}
               className="h-10 w-24"
               color="primary"
               onClick={stream}
               disabled={selectedSource === undefined}
            >
               Go Live
            </LoadingButton>
         </DialogActions>
      </HuginnDialogPanel>
   );
}
