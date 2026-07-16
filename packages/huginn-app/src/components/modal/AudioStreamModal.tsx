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
   const { data, isFetching, isLoading, refetch } = useQuery({
      queryKey: ["audio-sources"],
      queryFn: async () => await window.electronAPI.getAudioSources(),
      enabled: modal.isOpen,
   });

   const settings = useStorage("settings");
   const { setValue } = useStorageStore();

   const [selectedSource, setSelectedSource] = useState<AudioSource | undefined>();
   const [selectedQuality, setSelectedQuality] = useState<SelectItem>(
      qualityOptions.find((x) => x.value === settings.audioStreamQuality) ?? qualityOptions[0],
   );
   const [_, startTransition] = useTransition();

   useEffect(() => {
      if (modal.isOpen) {
         refetch();
      }
   }, [modal.isOpen]);

   useEffect(() => {
      if (!modal.isOpen) {
         setValue("settings", {
            ...settings,
            audioStreamQuality: selectedQuality!.value,
         });
      }
   }, [modal.isOpen]);

   function close() {
      setSelectedSource(undefined);
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
               data?.map((x) => (
                  <button
                     key={`${x.processId}-${x.name}`}
                     type="button"
                     onClick={() => handleSelect(x)}
                     className={clsx(
                        "bg-surface-alt ring-primary-700 flex cursor-pointer flex-col items-center justify-center gap-y-3 rounded-lg px-4 py-6 text-center transition-shadow",
                        x === selectedSource ? "ring-2" : "hover:ring-2",
                     )}
                  >
                     <img src={x.appIcon} className="aspect-square size-10" />
                     <div className="text-text w-full truncate text-sm wrap-anywhere">{x.name}</div>
                  </button>
               ))
            )}
         </div>
         <Tooltip>
            <Tooltip.Trigger asChild>
               <LoadingButton
                  className="group absolute bottom-2 left-2 flex size-10 items-center justify-center"
                  color="primary"
                  onClick={() => refetch()}
                  isLoading={isFetching}
               >
                  <IconMingcuteRefresh3Fill className="size-5 transition-transform group-hover:rotate-30" />
               </LoadingButton>
            </Tooltip.Trigger>
            <Tooltip.Content>Refresh</Tooltip.Content>
         </Tooltip>
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
