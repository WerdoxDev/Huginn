import HuginnButton from "@components/button/HuginnButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnTab from "@components/HuginnTab";
import HuginnCheckbox from "@components/HuginnToggle";
import HuginnRange from "@components/input/HuginnRange";
import { clamp, remap } from "@huginn/shared";
import { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useClient } from "@stores/clientStore";
import { useDevice } from "@stores/deviceStore";
import { useStorage } from "@stores/storageStore";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SelectItem, SettingsTabProps } from "@/types";

export default function SettingsVoiceTab(props: SettingsTabProps) {
   const { cameraDevices, inputDevices, outputDevices } = useDevice();

   const settings = useStorage("settings");
   const client = useClient();

   const inputDeviceOptions = useMemo<SelectItem[]>(() => inputDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [], [inputDevices]);
   const outputDeviceOptions = useMemo<SelectItem[]>(() => outputDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [], [outputDevices]);
   const cameraDeviceOptions = useMemo<SelectItem[]>(() => cameraDevices?.map((x) => ({ text: x.label, value: x.deviceId })) ?? [], [cameraDevices]);

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
         audioLevel.current.onAudioLevel = onAudioLevel;
      }

      runAudioChecker().catch(console.error);

      const interval = setInterval(() => {
         setInputDb(_inputDb.current);
      }, 100);

      return () => {
         cancelled = true;
         clearInterval(interval);
         audioLevel.current?.stopChecking();
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

   function onInputChange(item: SelectItem) {
      props.onChange?.({ inputDeviceId: item.value });
   }

   function onOutputChange(item: SelectItem) {
      props.onChange?.({ outputDeviceId: item.value });
   }

   function onCameraChange(item: SelectItem) {
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
      <div className="flex flex-col items-center">
         <div className="flex w-full max-w-xl flex-col">
            <div className="flex w-full flex-col gap-y-5">
               <div className="grid grid-cols-2 gap-x-5">
                  <HuginnSelect
                     className="w-full"
                     onChange={onInputChange}
                     selected={inputDeviceOptions.find((x) => x.value === selectedInput?.deviceId)}
                  >
                     <HuginnSelect.Label>Input Device</HuginnSelect.Label>
                     <HuginnSelect.List className="w-full!">
                        <HuginnSelect.ItemsWrapper>
                           {inputDeviceOptions?.map((x) => (
                              <HuginnSelect.Item key={x.value} item={x} />
                           ))}
                        </HuginnSelect.ItemsWrapper>
                     </HuginnSelect.List>
                  </HuginnSelect>
                  <HuginnSelect
                     className="w-full"
                     onChange={onOutputChange}
                     selected={outputDeviceOptions.find((x) => x.value === selectedOutput?.deviceId)}
                  >
                     <HuginnSelect.Label>Output Device</HuginnSelect.Label>
                     <HuginnSelect.List className="w-full!">
                        <HuginnSelect.ItemsWrapper>
                           {outputDeviceOptions?.map((x) => (
                              <HuginnSelect.Item key={x.value} item={x} />
                           ))}
                        </HuginnSelect.ItemsWrapper>
                     </HuginnSelect.List>
                  </HuginnSelect>
               </div>
               <div className="flex gap-x-5">
                  <HuginnRange onChange={onInputVolumeChange} defaultValue={settings.inputVolume} className="max-w-xs">
                     <HuginnRange.Label>Input Volume</HuginnRange.Label>
                     <HuginnRange.Input />
                  </HuginnRange>
                  <HuginnRange
                     onChange={onOutputVolumeChange}
                     defaultValue={settings.outputVolume}
                     maxValue={200}
                     className="max-w-xs"
                     getTooltipText={(v) => `${v}%`}
                  >
                     <HuginnRange.Label>Output Volume</HuginnRange.Label>
                     <HuginnRange.Input />
                  </HuginnRange>
               </div>
               <HuginnRange
                  className="max-w-165"
                  onChange={onInputThresholdChange}
                  defaultValue={remap(settings.inputThreshold ?? -100, -100, 0, 0, 100)}
                  getTooltipText={(percentage) => `${remap(percentage, 0, 100, -100, 0)}db`}
               >
                  <HuginnRange.Label>Input Threshold</HuginnRange.Label>
                  <HuginnRange.Input backgroundClassName="bg-positive-400!" fillClassName="bg-negative-100!">
                     <div
                        className="bg-surface-alt/50 absolute top-0 left-0 h-full transition-all duration-100"
                        style={{ width: `${remap(inputDb, -100, 0, 0, 100)}%` }}
                     />
                  </HuginnRange.Input>
               </HuginnRange>
               <div className="flex">
                  <HuginnCheckbox checked={noiseSuppression} onChange={setNoiseSuppression} className="w-45!">
                     <HuginnCheckbox.Toggle innerClassName="bg-surface-alt">Noise Suppression</HuginnCheckbox.Toggle>
                  </HuginnCheckbox>
               </div>
               <div className="bg-surface-alt h-px w-full" />
               {/* </HuginnTab.TabPanel> */}
               {/* <HuginnTab.TabPanel className="flex flex-col gap-y-5"> */}
               <HuginnSelect
                  className="w-full max-w-xs"
                  onChange={onCameraChange}
                  selected={cameraDeviceOptions.find((x) => x.value === selectedCamera?.deviceId)}
               >
                  <HuginnSelect.Label>Video Device</HuginnSelect.Label>
                  <HuginnSelect.List className="w-full">
                     <HuginnSelect.ItemsWrapper className="w-80">
                        {cameraDeviceOptions?.map((x) => (
                           <HuginnSelect.Item key={x.value} item={x} />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
               </HuginnSelect>
               <div className="bg-surface-deep relative flex aspect-video max-w-md items-center justify-center overflow-hidden rounded-lg shadow-lg">
                  {!isTestingCamera && (
                     <HuginnButton color="primary" className="absolute px-4 py-2" onClick={startCameraTest}>
                        Test Camera
                     </HuginnButton>
                  )}

                  <video ref={videoRef} autoPlay playsInline muted className="w-full" />
               </div>
            </div>
         </div>
         {/* </HuginnTab.TabPanel> */}
         {/* </HuginnTab.TabPanels> */}
         {/* </HuginnTab> */}
      </div>
   );
}
