import HuginnButton from "@components/button/HuginnButton";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import HuginnTab from "@components/HuginnTab";
import GenericLabel from "@components/input/GenericLabel";
import RangeInput from "@components/input/RangeInput";
import { clamp, remap } from "@huginn/shared";
import { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useStorage } from "@stores/storageStore";
import { useEffect, useMemo, useRef, useState } from "react";
import type { DropdownItem, SettingsTabProps } from "@/types";
import HuginnCheckbox from "@components/HuginnCheckbox";
import { useClient } from "@stores/clientStore";
import { useDevice } from "@stores/deviceStore";

export default function SettingsVoiceTab(props: SettingsTabProps) {
   const { cameraDevices, inputDevices, outputDevices } = useDevice();

   const settings = useStorage("settings");
   const client = useClient();

   const inputDeviceOptions = useMemo<DropdownItem[]>(() => inputDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [], [inputDevices]);
   const outputDeviceOptions = useMemo<DropdownItem[]>(
      () => outputDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [],
      [outputDevices],
   );
   const cameraDeviceOptions = useMemo<DropdownItem[]>(
      () => cameraDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [],
      [cameraDevices],
   );

   const audioLevel = useRef<AudioLevelChecker>(null);
   const inputDevice = useRef<VoiceInputDevice>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const videoStream = useRef<MediaStream>(null);
   const _inputDb = useRef(0);

   const [inputDb, setInputDb] = useState(0);

   const selectedInput = useMemo(() => inputDevices.find((x) => x.deviceId === settings.inputDeviceId), [inputDevices, settings.inputDeviceId]);
   const selectedOutput = useMemo(() => outputDevices.find((x) => x.deviceId === settings.outputDeviceId), [outputDevices, settings.outputDeviceId]);
   const selectedCamera = useMemo(() => cameraDevices.find((x) => x.deviceId === settings.cameraDeviceId), [cameraDevices, settings.cameraDeviceId]);

   const [noiseSuppression, setNoiseSuppression] = useState(settings.noiseSuppression);
   const [isTestingCamera, setIsTestingVideo] = useState(false);

   useEffect(() => {
      let cancelled = false;
      async function runAudioChecker() {
         if (!selectedInput || !client) {
            return;
         }

         if (!inputDevice.current) {
            inputDevice.current = new VoiceInputDevice(client);
         }

         audioLevel.current = new AudioLevelChecker();
         const stream = await inputDevice.current.getStream(selectedInput.deviceId, settings.inputVolume, noiseSuppression);
         // This is an async function so the component will probably unmount before it knows
         if (cancelled) {
            return;
         }

         audioLevel.current.startChecking(stream);
         audioLevel.current.offAll("audio-level");
         audioLevel.current.on("audio-level", onAudioLevel);
      }

      runAudioChecker().catch(console.error);

      const interval = setInterval(() => {
         setInputDb(_inputDb.current);
      }, 100);

      return () => {
         cancelled = true;
         clearInterval(interval);
         audioLevel.current?.stopChecking();
         audioLevel.current?.off("audio-level", onAudioLevel);
      };
   }, [selectedInput, noiseSuppression]);

   useEffect(() => {
      inputDevice.current?.setGain(settings.inputVolume);
   }, [settings.inputVolume]);

   useEffect(() => {
      props.onChange?.({ noiseSuppression: noiseSuppression });
   }, [noiseSuppression]);

   useEffect(() => {
      return () => {
         stopCameraTest();
      };
   }, []);

   function onAudioLevel(db: number) {
      _inputDb.current = clamp(db, -100, 100);
   }

   function onInputChange(item: DropdownItem) {
      props.onChange?.({ inputDeviceId: item.value });
   }

   function onOutputChange(item: DropdownItem) {
      props.onChange?.({ outputDeviceId: item.value });
   }

   function onCameraChange(item: DropdownItem) {
      props.onChange?.({ cameraDeviceId: item.value });
   }

   function onInputVolumeChange(value: number) {
      props.onChange?.({ inputVolume: value });
   }

   function onOutputVolumeChange(value: number) {
      props.onChange?.({ outputVolume: value });
   }

   function onInputThresholdChange(value: number) {
      props.onChange?.({ inputThreshold: value - 100 });
   }

   function onTabChange(_index: number) {
      stopCameraTest();
   }

   function stopCameraTest() {
      if (videoRef.current) {
         videoRef.current.srcObject = null;
      }

      if (videoStream.current) {
         videoStream.current.getVideoTracks()[0].stop();
      }

      setIsTestingVideo(false);
   }

   async function startCameraTest() {
      if (!selectedCamera || !videoRef.current) {
         return;
      }

      setIsTestingVideo(true);
      const stream = await navigator.mediaDevices.getUserMedia({
         video: { deviceId: selectedCamera.deviceId, frameRate: 60 },
      });
      videoRef.current.srcObject = stream;
      const video = stream.getVideoTracks()[0];
      videoStream.current = stream;
      video.onended = () => {
         stopCameraTest();
      };
   }

   return (
      <div className="flex flex-col">
         <HuginnTab onChange={onTabChange}>
            <HuginnTab.TabList className="w-max" tabClassName="px-5 py-1">
               <HuginnTab.Tab>
                  <IconMingcuteVolumeFill className="size-5" />
                  <div>Audio</div>
               </HuginnTab.Tab>
               <HuginnTab.Tab>
                  <IconMingcuteCamera2Fill className="size-5" />
                  <div>Video</div>
               </HuginnTab.Tab>
            </HuginnTab.TabList>
            <HuginnTab.TabPanels className="mt-5">
               <HuginnTab.TabPanel>
                  <div className="flex gap-x-5">
                     <HuginnDropdown
                        className="w-full max-w-xs"
                        onChange={onInputChange}
                        value={inputDeviceOptions.find((x) => x.value === selectedInput?.deviceId)}
                     >
                        <HuginnDropdown.Label>Input Device</HuginnDropdown.Label>
                        <HuginnDropdown.List className="w-full">
                           <HuginnDropdown.ItemsWrapper className="w-80">
                              {inputDeviceOptions?.map((x) => (
                                 <HuginnDropdown.Item key={x.value} item={x} />
                              ))}
                           </HuginnDropdown.ItemsWrapper>
                        </HuginnDropdown.List>
                     </HuginnDropdown>
                     <HuginnDropdown
                        className="w-full max-w-xs"
                        onChange={onOutputChange}
                        value={outputDeviceOptions.find((x) => x.value === selectedOutput?.deviceId)}
                     >
                        <HuginnDropdown.Label>Output Device</HuginnDropdown.Label>
                        <HuginnDropdown.List className="w-full">
                           <HuginnDropdown.ItemsWrapper className="w-80">
                              {outputDeviceOptions?.map((x) => (
                                 <HuginnDropdown.Item key={x.value} item={x} />
                              ))}
                           </HuginnDropdown.ItemsWrapper>
                        </HuginnDropdown.List>
                     </HuginnDropdown>
                  </div>
                  <div className="mt-5 flex gap-x-5">
                     <div className="w-full max-w-xs">
                        <GenericLabel>Input Volume</GenericLabel>
                        <RangeInput onChange={onInputVolumeChange} defaultValue={settings.inputVolume} />
                     </div>
                     <div className="w-full max-w-xs">
                        <GenericLabel>Output Volume</GenericLabel>
                        <RangeInput onChange={onOutputVolumeChange} defaultValue={settings.outputVolume} maxValue={200} />
                     </div>
                  </div>
                  <div className="mt-5 flex">
                     <div className="max-w-165 w-full">
                        <GenericLabel>Input Threshold</GenericLabel>
                        <RangeInput
                           onChange={onInputThresholdChange}
                           backgroundClassName="bg-positive-400!"
                           fillClassName="bg-negative-100!"
                           defaultValue={remap(settings.inputThreshold ?? -100, -100, 0, 0, 100)}
                           getTooltipText={(percentage) => `${remap(percentage, 0, 100, -100, 0)}db`}
                        >
                           <div
                              className="bg-surface-alt/50 absolute left-0 top-0 h-full transition-all duration-100"
                              style={{ width: `${remap(inputDb, -100, 0, 0, 100)}%` }}
                           />
                        </RangeInput>
                     </div>
                  </div>
                  <div className="mt-5 flex">
                     <HuginnCheckbox checked={noiseSuppression} onChange={setNoiseSuppression} className="w-45!">
                        <HuginnCheckbox.Toggle innerClassName="bg-surface-alt">Noise Suppression</HuginnCheckbox.Toggle>
                     </HuginnCheckbox>
                  </div>
               </HuginnTab.TabPanel>
               <HuginnTab.TabPanel className="flex flex-col gap-y-5">
                  <HuginnDropdown
                     className="w-full max-w-xs"
                     onChange={onCameraChange}
                     value={cameraDeviceOptions.find((x) => x.value === selectedCamera?.deviceId)}
                  >
                     <HuginnDropdown.Label>Video Device</HuginnDropdown.Label>
                     <HuginnDropdown.List className="w-full">
                        <HuginnDropdown.ItemsWrapper className="w-80">
                           {cameraDeviceOptions?.map((x) => (
                              <HuginnDropdown.Item key={x.value} item={x} />
                           ))}
                        </HuginnDropdown.ItemsWrapper>
                     </HuginnDropdown.List>
                  </HuginnDropdown>
                  <div className="bg-surface-deep relative flex aspect-video max-w-md items-center justify-center overflow-hidden rounded-lg shadow-lg">
                     {!isTestingCamera && (
                        <HuginnButton color="primary" className="absolute px-4 py-2" onClick={startCameraTest}>
                           Test Camera
                        </HuginnButton>
                     )}

                     <video ref={videoRef} autoPlay playsInline muted className="w-full" />
                  </div>
               </HuginnTab.TabPanel>
            </HuginnTab.TabPanels>
         </HuginnTab>
      </div>
   );
}
