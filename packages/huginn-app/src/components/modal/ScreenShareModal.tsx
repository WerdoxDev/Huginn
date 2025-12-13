import DisplayPreview from "@components/DisplayPreview";
import HuginnTab from "@components/HuginnTab";
import LoadingIcon from "@components/LoadingIcon";
import { Checkbox, DialogPanel, Disclosure, DisclosureButton, DisclosurePanel } from "@headlessui/react";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState, useTransition } from "react";
import type { DisplaySource, DropdownItem } from "@/types";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import HuginnCheckbox from "@components/HuginnCheckbox";

const qualities: DropdownItem[] = [
   { text: "Low (480p)", value: "low" },
   { text: "Medium (720p)", value: "medium" },
   { text: "High (1080p)", value: "high" },
   { text: "Ultra (1440p)", value: "ultra" },
];

const frameRates: DropdownItem[] = [
   { text: "5 fps", value: "5" },
   { text: "15 fps", value: "15" },
   { text: "30 fps", value: "30" },
   { text: "60 fps", value: "60" },
];

const qualityToResolution = {
   ultra: { width: 2560, height: 1440 },
   high: { width: 1920, height: 1080 },
   medium: { width: 1280, height: 720 },
   low: { width: 854, height: 480 },
};

export default function ScreenShareModal() {
   const client = useClient();
   const { screenShare: modal, updateModals } = useModals();
   const { data, isLoading, refetch } = useQuery({
      queryKey: ["display-sources"],
      queryFn: async () => await window.electronAPI.getDisplaySources(),
      enabled: modal.isOpen,
      // refetchOnMount: true,
   });

   const settings = useStorage("settings");
   const { setValue } = useStorageStore();

   const [selectedQuality, setSelectedQuality] = useState<DropdownItem>(
      qualities.find((x) => x.value === settings.screenShareQuality) ?? qualities[0],
   );
   const [selectedFramerate, setSelectedFramerate] = useState<DropdownItem>(
      frameRates.find((x) => x.value === settings.screenShareFramerate) ?? frameRates[0],
   );
   const [isAudioEnabled, setIsAudioEnabled] = useState(settings.screenShareAudio);
   const [isSimulcastEnabled, setIsSimulcastEnabled] = useState(settings.screenShareSimulcast);
   const [screenSharePending, startTransition] = useTransition();

   const screens = useMemo(() => data?.filter((x) => x.id.includes("screen")), [data]);
   const applications = useMemo(() => data?.filter((x) => x.id.includes("window")), [data]);

   useEffect(() => {
      refetch();
   }, []);

   useEffect(() => {
      if (!modal.isOpen) {
         setValue("settings", {
            ...settings,
            screenShareQuality: selectedQuality!.value,
            screenShareFramerate: selectedFramerate!.value,
            screenShareAudio: isAudioEnabled,
         });
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ screenShare: { isOpen: false, callback: undefined } });
   }

   async function start(source: DisplaySource) {
      if (!source || !selectedFramerate || !selectedQuality) {
         return;
      }

      window.electronAPI.setSelectedDisplaySource(source.id);

      const framerate = Number(selectedFramerate?.value);
      const { width, height } = qualityToResolution[selectedQuality.value as keyof typeof qualityToResolution];

      startTransition(async () => {
         close();
         // This is to prevent Electron from giving the same video track back
         const producer = client?.voice.transport.getProducer("stream_video");
         producer?.track?.stop();
         await new Promise((r) => setTimeout(r, 1000));

         const stream = await navigator.mediaDevices.getDisplayMedia({
            audio: isAudioEnabled,
            video: {
               frameRate: { ideal: framerate },
               width: { ideal: width },
               height: { ideal: height },
               // aspectRatio: { ideal: 16 / 9 },
            },
         });

         modal.callback?.(stream, isAudioEnabled, isSimulcastEnabled, source.name);
      });
   }

   return (
      <DialogPanel
         transition
         className="border-primary-800 bg-surface data-closed:scale-90 max-h-160 relative flex h-full w-full max-w-3xl transform select-none overflow-hidden rounded-xl border-2 transition-[opacity_transform] duration-200"
      >
         <div className="mt-5 flex w-full flex-col gap-y-3 overflow-hidden">
            <HuginnTab className="flex h-full flex-col">
               <HuginnTab.TabList className="mx-5" tabClassName="w-full py-1">
                  <HuginnTab.Tab>
                     <IconMingcuteMonitorFill className="size-5" />
                     <div>Screens</div>
                  </HuginnTab.Tab>
                  <HuginnTab.Tab>
                     <IconMingcuteWebFill className="size-5" />
                     <div>Applications</div>
                  </HuginnTab.Tab>
                  <HuginnTab.Tab>
                     <IconMingcuteVideoCamera2Fill className="size-5" />
                     <div>Devices</div>
                  </HuginnTab.Tab>
               </HuginnTab.TabList>
               <HuginnTab.TabPanels
                  className="scroll-surface-alt mt-4 h-full overflow-y-scroll pb-5 pl-5 pr-1.5 pt-1"
                  panelClassName="grid grid-cols-2 gap-5"
               >
                  {isLoading ? (
                     <div className="flex h-full w-full items-center justify-center">
                        <LoadingIcon className="size-16" />
                     </div>
                  ) : (
                     <>
                        <HuginnTab.TabPanel>
                           {screens?.map((x) => (
                              <DisplayPreview key={x.id} source={x} onSelect={start} />
                           ))}
                        </HuginnTab.TabPanel>
                        <HuginnTab.TabPanel>
                           {applications?.map((x) => (
                              <DisplayPreview key={x.id} source={x} onSelect={start} />
                           ))}
                        </HuginnTab.TabPanel>
                     </>
                  )}
               </HuginnTab.TabPanels>
            </HuginnTab>
         </div>
         <div className="bg-surface-alt flex shrink-0 flex-col gap-y-5 p-5">
            <HuginnDropdown value={selectedQuality} onChange={setSelectedQuality}>
               <HuginnDropdown.Label>Quality</HuginnDropdown.Label>
               <HuginnDropdown.List className="bg-surface! w-40!">
                  <HuginnDropdown.ItemsWrapper anchor="bottom start">
                     {qualities.map((x) => (
                        <HuginnDropdown.Item key={x.value} item={x} />
                     ))}
                  </HuginnDropdown.ItemsWrapper>
               </HuginnDropdown.List>
            </HuginnDropdown>
            <HuginnDropdown value={selectedFramerate} onChange={setSelectedFramerate}>
               <HuginnDropdown.Label>Frame Rate</HuginnDropdown.Label>
               <HuginnDropdown.List className="bg-surface! w-30!">
                  <HuginnDropdown.ItemsWrapper anchor="bottom start">
                     {frameRates.map((x) => (
                        <HuginnDropdown.Item key={x.value} item={x} />
                     ))}
                  </HuginnDropdown.ItemsWrapper>
               </HuginnDropdown.List>
            </HuginnDropdown>

            <HuginnCheckbox checked={isAudioEnabled} onChange={setIsAudioEnabled}>
               <HuginnCheckbox.Toggle>Share Audio</HuginnCheckbox.Toggle>
            </HuginnCheckbox>
            <div className="bg-surface h-px w-full px-0" />
            <Disclosure>
               <DisclosureButton className="hover:text-primary-500 group flex cursor-pointer items-center text-white transition-colors">
                  <span>Advanced</span>
                  <IconMingcuteDownFill className="group-data-open:rotate-180 ml-auto h-4 w-4 shrink-0 transition-transform" />
               </DisclosureButton>
               <DisclosurePanel transition className="data-closed:-translate-y-5 data-closed:opacity-0 origin-top transition">
                  <HuginnCheckbox checked={isSimulcastEnabled} onChange={setIsSimulcastEnabled}>
                     <HuginnCheckbox.Toggle>Use Simulcast</HuginnCheckbox.Toggle>
                     <div className="mt-1 max-w-40 text-xs text-white/40">Requires more bandwidth. Provides better experience for others</div>
                  </HuginnCheckbox>
               </DisclosurePanel>
            </Disclosure>
         </div>
         {/* <ModalCloseButton onClick={close} /> */}
      </DialogPanel>
   );
}
