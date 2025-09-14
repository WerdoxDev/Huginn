import HuginnButton from "@components/button/HuginnButton";
import LoadingButton from "@components/button/LoadingButton";
import ModalCloseButton from "@components/button/ModalCloseButton";
import LoadingIcon from "@components/LoadingIcon";
import { DialogPanel } from "@headlessui/react";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { voiceClient } from "@stores/voiceStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState, useTransition } from "react";
import type { AudioSource } from "@/types";

export default function StreamAudioModal() {
   const client = useClient();
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
      updateModals({ streamAudio: { isOpen: false } });
   }

   async function stream() {
      if (!selectedSource) {
         return;
      }

      startTransition(async () => {
         // Reset loopback even if we want to start a new one / end the last one
         await voiceClient.stopAudioLoopback();

         const audioTrack = await voiceClient.getAudioTrackFromLoopback(undefined, selectedSource.processId);

         await client?.voice.startStream(undefined, audioTrack);
         close();
      });
   }

   return (
      <DialogPanel
         transition
         className="border-primary-800 bg-surface data-closed:scale-90 relative w-full max-w-lg transform select-none overflow-hidden rounded-xl border-2 py-5 pb-0 transition-[opacity_transform] duration-200"
      >
         <div className="flex flex-col gap-y-3 pb-5">
            <div className="text-text text-center text-2xl font-bold">Stream Audio</div>
            <div className="text-text/80 px-2 text-center">Choose an application to share it's audio with others</div>
            <div className="scroll-alternative border-primary-700 mx-5 mt-5 flex h-72 flex-col gap-y-2 overflow-y-scroll rounded-lg border p-2.5 pr-1.5">
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
         </div>
         <div className="bg-surface-alt flex w-full items-center gap-x-2 p-5">
            <LoadingButton className="h-10 w-24" color="surface" onClick={refetch} loading={isFetching}>
               Refresh
            </LoadingButton>
            <HuginnButton className="ml-auto h-10 w-20 decoration-white hover:underline" onClick={close}>
               Cancel
            </HuginnButton>
            <LoadingButton
               loading={streamAudioPending}
               className="h-10 w-24"
               color="primary"
               onClick={stream}
               disabled={selectedSource === undefined}
            >
               Go Live
            </LoadingButton>
         </div>
         <ModalCloseButton onClick={close} />
      </DialogPanel>
   );
}
