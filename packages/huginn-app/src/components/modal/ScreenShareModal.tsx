import DisplaySourcePreview from "@components/DisplaySourcePreview";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnAccordion from "@components/HuginnAccordion";
import HuginnCheckbox from "@components/HuginnCheckbox";
import HuginnTab from "@components/HuginnTab";
import HuginnSlider from "@components/input/HuginnSlider";
import LoadingIcon from "@components/LoadingIcon";
import { useVoiceSnapshot } from "@hooks/voice/useMediaSources";
import { analytics, CONSTANTS, recordSpanError } from "@huginnjs/shared";
import { SCREEN_SHARE_FRAME_RATES, SCREEN_SHARE_QUALITIES } from "@lib/constants";
import { VoiceClient } from "@lib/voice/voice-client";
import { useDevice } from "@stores/deviceStore";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useMemo, useState } from "react";

import type { DisplaySource, SelectItem } from "@/types";

import HuginnDialogPanel from "./HuginnDialogPanel";

const qualityOptions: SelectItem[] = SCREEN_SHARE_QUALITIES.map((x) => ({
   text: `${x.name} ${x.height}p`,
   value: x.value,
}));
const frameRateOptions: SelectItem[] = SCREEN_SHARE_FRAME_RATES.map((x) => ({
   text: `${x} fps`,
   value: x.toString(),
}));

export default function ScreenShareModal() {
   const { screenShare: modal, updateModals } = useModals();
   const { data, isLoading } = useQuery({
      queryKey: ["display-sources"],
      queryFn: async () => await window.electronAPI.getDisplaySources(),
      enabled: modal.isOpen,
      refetchInterval: 1000,
   });

   const { inputDevices, cameraDevices } = useDevice();
   const { mediaSources } = useVoiceSnapshot();
   const videoProducer = useMemo(
      () => (modal.type === "change" ? mediaSources.find((x) => x.kind === "stream_video" && x.type === "producing") : undefined),
      [mediaSources, modal],
   );
   const audioProducer = useMemo(
      () => (modal.type === "change" ? mediaSources.find((x) => x.kind === "stream_audio" && x.type === "producing") : undefined),
      [mediaSources, modal],
   );

   const settings = useStorage("settings");
   const { setValue } = useStorageStore();

   const inputDeviceOptions = useMemo<SelectItem[]>(() => inputDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [], [inputDevices]);

   const [selectedQuality, setSelectedQuality] = useState<SelectItem>(
      qualityOptions.find((x) =>
         videoProducer?.trackSettings
            ? SCREEN_SHARE_QUALITIES.find((y) => videoProducer.trackSettings?.height === y.height)?.value === x.value
            : x.value === settings.screenShareQuality,
      ) ?? qualityOptions[0],
   );
   const [selectedFramerate, setSelectedFramerate] = useState<SelectItem>(
      frameRateOptions.find((x) =>
         videoProducer?.trackSettings
            ? SCREEN_SHARE_FRAME_RATES.find((y) => videoProducer.trackSettings?.frameRate === y) === Number(x.value)
            : x.value === settings.screenShareFramerate,
      ) ?? frameRateOptions[0],
   );
   const [selectedInput, setSelectedInput] = useState<SelectItem>(inputDeviceOptions[0]);
   const [maxVideoBitrate, setMaxVideoBitrate] = useState<number>(videoProducer?.maxBitrate ?? settings.screenShareVideoBitrate);
   const [maxAudioBitrate, setMaxAudioBitrate] = useState<number>(audioProducer?.maxBitrate ?? settings.screenShareAudioBitrate);
   const [isAudioEnabled, setIsAudioEnabled] = useState(settings.screenShareAudio);
   const [isSimulcastEnabled, setIsSimulcastEnabled] = useState(settings.screenShareSimulcast);

   const [activeTab, setActiveTab] = useState("screens");

   const screens = useMemo(() => data?.filter((x) => x.electronId.includes("screen")), [data]);
   const applications = useMemo(() => data?.filter((x) => x.electronId.includes("window")), [data]);

   useEffect(() => {
      if (!modal.isOpen) {
         setValue("settings", {
            ...settings,
            screenShareQuality: selectedQuality!.value,
            screenShareFramerate: selectedFramerate!.value,
            screenShareAudio: isAudioEnabled,
            screenShareSimulcast: isSimulcastEnabled,
            screenShareAudioBitrate: maxAudioBitrate,
            screenShareVideoBitrate: maxVideoBitrate,
         });
      }
   }, [modal.isOpen]);

   function close() {
      updateModals({ screenShare: { isOpen: false, callback: undefined } });
   }

   async function handleSelect(source?: DisplaySource, deviceInfo?: MediaDeviceInfo) {
      analytics.startActiveSpan("screenShareModal.handleSelect", async (span) => {
         const type = source ? (source.electronId.includes("screen") ? "screen" : "application") : "device";
         span.setAttributes({
            "params.source.id": source?.electronId ?? "none",
            "params.source.name": source?.name ?? "none",
            "params.device.id": deviceInfo?.deviceId ?? "none",
            "params.device.name": deviceInfo?.label ?? "none",
            max_video_bitrate: maxVideoBitrate,
            max_audio_bitrate: maxAudioBitrate,
            type: type,
            quality: selectedQuality?.value,
            framerate: selectedFramerate?.value,
            is_audio_enabled: isAudioEnabled,
            is_simulcast_enabled: isSimulcastEnabled,
         });

         try {
            if ((!source && !deviceInfo) || !selectedFramerate || !selectedQuality) return;

            if (source) {
               window.electronAPI.setSelectedDisplaySource(source);
            }

            const frameRate = Number(selectedFramerate?.value);
            const { width, height } = SCREEN_SHARE_QUALITIES.find((x) => x.value === selectedQuality.value)!;

            span.setAttributes({ width: width, height: height });

            close();
            // This is to prevent Electron from giving the same video track back
            await VoiceClient.sendMessage("prepare_stream_replacement");

            let stream: MediaStream;
            if (source) {
               stream = await navigator.mediaDevices.getDisplayMedia({
                  audio: false,
                  video: {
                     frameRate: { ideal: frameRate },
                     width: { ideal: width },
                     height: { ideal: height },
                  },
               });
            } else {
               stream = await navigator.mediaDevices.getUserMedia({
                  audio: isAudioEnabled
                     ? {
                          deviceId: selectedInput.value,
                          sampleRate: 48000,
                          channelCount: 2,
                          echoCancellation: false,
                          noiseSuppression: false,
                          autoGainControl: false,
                       }
                     : false,
                  video: {
                     frameRate: { ideal: frameRate },
                     width: { ideal: width },
                     height: { ideal: height },
                  },
               });
            }

            span.setAttributes({
               "stream.audio_tracks.count": stream.getAudioTracks().length,
               "stream.video_tracks.count": stream.getVideoTracks().length,
            });

            await modal.callback?.({
               type: type,
               stream,
               isAudioEnabled,
               isSimulcastEnabled,
               maxAudioBitrate,
               maxVideoBitrate,
               processId: source?.processId,
            });
         } catch (e) {
            recordSpanError(e);
            modal.errback?.({
               error: e,
            });
         }
      });
   }

   return (
      <HuginnDialogPanel className="flex h-full max-h-160 w-full max-w-3xl select-none">
         <div className="mt-5 flex w-full flex-col gap-y-3 overflow-hidden">
            <HuginnTab className="flex h-full flex-col" onChange={setActiveTab}>
               <HuginnTab.TabList className="mx-5" tabClassName="w-full py-1">
                  <HuginnTab.Tab value="screens">
                     <IconMingcuteMonitorFill className="size-5" />
                     <div>Screens</div>
                  </HuginnTab.Tab>
                  <HuginnTab.Tab value="applications">
                     <IconMingcuteWebFill className="size-5" />
                     <div>Applications</div>
                  </HuginnTab.Tab>
                  <HuginnTab.Tab value="devices">
                     <IconMingcuteVideoCamera2Fill className="size-5" />
                     <div>Devices</div>
                  </HuginnTab.Tab>
               </HuginnTab.TabList>
               <HuginnTab.TabPanels
                  className="scroll-surface-alt mt-4 h-full overflow-y-scroll pt-1 pr-1.5 pb-5 pl-5"
                  panelClassName="grid grid-cols-2 gap-5"
               >
                  {isLoading ? (
                     <div className="flex h-full w-full items-center justify-center">
                        <LoadingIcon className="size-16" />
                     </div>
                  ) : (
                     <>
                        <HuginnTab.TabPanel value="screens">
                           {screens?.map((x) => (
                              <DisplaySourcePreview key={x.electronId} source={x} onSelect={handleSelect} />
                           ))}
                        </HuginnTab.TabPanel>
                        <HuginnTab.TabPanel value="applications">
                           {applications?.map((x) => (
                              <DisplaySourcePreview key={x.electronId} source={x} onSelect={handleSelect} />
                           ))}
                        </HuginnTab.TabPanel>
                        <HuginnTab.TabPanel value="devices">
                           {cameraDevices?.map((x) => (
                              <DisplaySourcePreview key={x.deviceId} deviceInfo={x} onSelect={handleSelect} />
                           ))}
                        </HuginnTab.TabPanel>
                     </>
                  )}
               </HuginnTab.TabPanels>
            </HuginnTab>
         </div>
         <div className="bg-surface-alt flex w-56 shrink-0 flex-col gap-y-5 p-5">
            <HuginnSelect selected={selectedQuality} onChange={setSelectedQuality}>
               <HuginnSelect.Label>Quality</HuginnSelect.Label>
               <HuginnSelect.List className="bg-surface! w-full!">
                  <HuginnSelect.ItemsWrapper>
                     {qualityOptions.map((x) => (
                        <HuginnSelect.Item key={x.value} item={x} />
                     ))}
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>
            <HuginnSelect selected={selectedFramerate} onChange={setSelectedFramerate}>
               <HuginnSelect.Label>Frame Rate</HuginnSelect.Label>
               <HuginnSelect.List className="bg-surface! w-full!">
                  <HuginnSelect.ItemsWrapper>
                     {frameRateOptions.map((x) => (
                        <HuginnSelect.Item key={x.value} item={x} />
                     ))}
                  </HuginnSelect.ItemsWrapper>
               </HuginnSelect.List>
            </HuginnSelect>

            <HuginnCheckbox checked={isAudioEnabled} onChange={setIsAudioEnabled}>
               <HuginnCheckbox.Input innerClassName="bg-surface!">Share Audio</HuginnCheckbox.Input>
            </HuginnCheckbox>

            {isAudioEnabled && activeTab === "devices" && (
               <HuginnSelect className="w-full max-w-xs" onChange={setSelectedInput} selected={selectedInput}>
                  <HuginnSelect.Label>Input Device</HuginnSelect.Label>
                  <HuginnSelect.List className="bg-surface! w-40!">
                     <HuginnSelect.ItemsWrapper className="w-80">
                        {inputDeviceOptions?.map((x) => (
                           <HuginnSelect.Item key={x.value} item={x} />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
               </HuginnSelect>
            )}
            <div className="bg-surface h-px w-full px-0" />
            <HuginnAccordion>
               <HuginnAccordion.Item className="flex flex-col gap-y-2.5">
                  <HuginnAccordion.Header>
                     <HuginnAccordion.Trigger className="group hover:text-primary-500 flex w-full cursor-pointer items-center text-white transition-colors">
                        <span>Advanced</span>
                        <IconMingcuteDownFill className="ml-auto h-4 w-4 shrink-0 transition-transform group-data-panel-open:rotate-180" />
                     </HuginnAccordion.Trigger>
                  </HuginnAccordion.Header>
                  <HuginnAccordion.Panel className="flex flex-col gap-y-5">
                     {modal.type === "create" && (
                        <HuginnCheckbox checked={isSimulcastEnabled} onChange={setIsSimulcastEnabled} className="flex-col">
                           <HuginnCheckbox.Input innerClassName="bg-surface!">Use Simulcast</HuginnCheckbox.Input>
                           <div className="mt-1 max-w-40 text-xs text-white/40">Requires more bandwidth. Provides better experience for others</div>
                        </HuginnCheckbox>
                     )}
                     <HuginnSlider
                        defaultValue={maxVideoBitrate}
                        onChange={setMaxVideoBitrate}
                        maxValue={CONSTANTS.MAX_VIDEO_BITRATE}
                        minValue={CONSTANTS.MIN_VIDEO_BITRATE}
                        step={100000}
                        getTooltipText={(v) => `${v / 1000000} mbps`}
                     >
                        <HuginnSlider.Label>Video Bitrate: {maxVideoBitrate / 1000000} mbps</HuginnSlider.Label>
                        <HuginnSlider.Input backgroundClassName="bg-surface-deep" />
                     </HuginnSlider>
                     <HuginnSlider
                        defaultValue={maxAudioBitrate}
                        onChange={setMaxAudioBitrate}
                        maxValue={CONSTANTS.MAX_AUDIO_BITRATE}
                        minValue={CONSTANTS.MIN_AUDIO_BITRATE}
                        step={10000}
                        getTooltipText={(v) => `${v / 1000} kbps`}
                     >
                        <HuginnSlider.Label>Audio Bitrate: {maxAudioBitrate / 1000} kbps</HuginnSlider.Label>
                        <HuginnSlider.Input backgroundClassName="bg-surface-deep" />
                     </HuginnSlider>
                  </HuginnAccordion.Panel>
               </HuginnAccordion.Item>
            </HuginnAccordion>
         </div>
      </HuginnDialogPanel>
   );
}
