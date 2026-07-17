import AudioSourcePreview from "@components/AudioSourcePreview";
import LoadingButton from "@components/button/LoadingButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import LoadingIcon from "@components/LoadingIcon";
import Tooltip from "@components/tooltip/Tooltip";
import { AUDIO_QUALITIES } from "@lib/constants";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useState, useTransition } from "react";

import type { AudioSource, SelectItem } from "@/types";

import HuginnDialogPanel from "./HuginnDialogPanel";

const qualityOptions: SelectItem[] = AUDIO_QUALITIES.map((x) => ({ text: `${x.name} (${x.bitrate / 1000} kbps)`, value: x.value }));
const audioQualityToBitrate: Record<string, number> = AUDIO_QUALITIES.reduce(
   (acc, x) => {
      acc[x.value] = x.bitrate;
      return acc;
   },
   {} as Record<string, number>,
);

export default function AudioStreamModal() {
   const { audioStream: modal, updateModals } = useModals();
   const { data, isLoading } = useQuery({
      queryKey: ["audio-sources"],
      queryFn: async () => await window.electronAPI.getAudioSources(),
      enabled: modal.isOpen,
      refetchInterval: 1000,
   });

   const settings = useStorage("settings");
   const { setValue } = useStorageStore();

   // const [selectedSource, setSelectedSource] = useState<AudioSource | undefined>();
   const [selectedQuality, setSelectedQuality] = useState<SelectItem>(
      qualityOptions.find((x) => x.value === settings.audioStreamQuality) ?? qualityOptions[0],
   );
   const [_, startTransition] = useTransition();

   useEffect(() => {
      if (!modal.isOpen) {
         setValue("settings", {
            ...settings,
            audioStreamQuality: selectedQuality!.value,
         });
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ audioStream: { isOpen: false, callback: undefined } });
   }

   async function handleSelect(source: AudioSource) {
      startTransition(async () => {
         close();

         const maxAudioBitrate = audioQualityToBitrate[selectedQuality.value];
         await modal.callback?.({ processId: source.processId, maxAudioBitrate });
      });
   }

   return (
      <HuginnDialogPanel className="flex h-full max-h-160 w-full max-w-3xl select-none">
         <div className="scroll-surface-alt grid h-full w-full grid-cols-2 gap-5 overflow-y-scroll pt-5 pr-1.5 pb-5 pl-5">
            {isLoading ? (
               <div className="col-span-2 flex h-full w-full items-center justify-center">
                  <LoadingIcon className="size-16" />
               </div>
            ) : (
               data?.map((x) => <AudioSourcePreview onSelect={handleSelect} source={x} key={x.processId} />)
            )}
         </div>
         <div className="bg-surface-alt flex w-56 shrink-0 flex-col gap-y-5 p-5">
            <HuginnSelect selected={selectedQuality} onChange={setSelectedQuality}>
               <HuginnSelect.Label>Audio Quality</HuginnSelect.Label>
               <HuginnSelect.List className="bg-surface! w-full!">
                  <HuginnSelect.ItemsWrapper>
                     {qualityOptions.map((x) => (
                        <HuginnSelect.Item key={x.value} item={x} />
                     ))}
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>

            {/* <div className="mt-auto flex flex-col gap-y-2.5">
               <LoadingButton
                  isLoading={streamAudioPending}
                  className="h-10 w-full"
                  color="primary"
                  onClick={stream}
                  disabled={selectedSource === undefined}
               >
                  Go Live
               </LoadingButton>
               <HuginnButton className="h-10 w-full text-center decoration-white hover:underline" onClick={close}>
                  Cancel
               </HuginnButton>
            </div> */}
         </div>
      </HuginnDialogPanel>
   );
}
