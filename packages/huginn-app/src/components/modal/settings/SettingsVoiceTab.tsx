import { App } from "@capacitor/app";
import HuginnButton from "@components/button/HuginnButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnCheckbox from "@components/HuginnCheckbox";
import HuginnSlider from "@components/input/HuginnSlider";
import AndroidAudioRouteSelect from "@components/voice/AndroidAudioRouteSelect";
import { useCapacitorListener } from "@hooks/useCapacitorListener";
import { useNativePermissionModal } from "@hooks/useNativePermissionModal";
import { clamp, remap } from "@huginnjs/shared";
import { NativeMediaDevices, type MediaDevicePermission, type MediaDevicePermissionStatus } from "@lib/capacitor/media-devices-plugin";
import { AudioLevelChecker } from "@lib/voice/audio-level-checker";
import { VoiceInputDevice } from "@lib/voice/voice-input-device";
import { useClient } from "@stores/clientStore";
import { refreshDevices, useDevice } from "@stores/deviceStore";
import { useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useMemo, useRef, useState } from "react";

import type { SelectItem, SettingsTabProps } from "@/types";

export default function SettingsVoiceTab(props: SettingsTabProps) {
   const { environment } = useHuginnWindow();
   const isMobileEnvironment = environment === "android";
   const { cameraDevices, inputDevices, outputDevices } = useDevice();
   const settings = useStorage("settings");
   const client = useClient();
   const { openAppSettings, showPermissionIssues } = useNativePermissionModal();

   const inputDeviceOptions = useMemo<SelectItem[]>(
      () => inputDevices.map((device, index) => ({ text: device.label || `Input device ${index + 1}`, value: device.deviceId })),
      [inputDevices],
   );
   const outputDeviceOptions = useMemo<SelectItem[]>(
      () => outputDevices.map((device, index) => ({ text: device.label || `Output device ${index + 1}`, value: device.deviceId })),
      [outputDevices],
   );
   const cameraDeviceOptions = useMemo<SelectItem[]>(
      () => cameraDevices.map((device, index) => ({ text: device.label || `Camera ${index + 1}`, value: device.deviceId })),
      [cameraDevices],
   );

   const [permissionStatus, setPermissionStatus] = useState<MediaDevicePermissionStatus | null>(null);
   const [noiseSuppression, setNoiseSuppression] = useState(settings.noiseSuppression);
   const [isTestingCamera, setIsTestingCamera] = useState(false);
   const [inputDb, setInputDb] = useState(0);

   const audioLevel = useRef<AudioLevelChecker>(null);
   const videoRef = useRef<HTMLVideoElement>(null);
   const videoStream = useRef<MediaStream>(null);
   const currentInputDb = useRef(0);

   const selectedInput = useMemo(
      () => inputDevices.find((device) => device.deviceId === settings.inputDeviceId),
      [inputDevices, settings.inputDeviceId],
   );
   const selectedOutput = useMemo(
      () => outputDevices.find((device) => device.deviceId === settings.outputDeviceId),
      [outputDevices, settings.outputDeviceId],
   );
   const selectedCamera = useMemo(
      () => cameraDevices.find((device) => device.deviceId === settings.cameraDeviceId),
      [cameraDevices, settings.cameraDeviceId],
   );
   const microphoneDeviceId = isMobileEnvironment ? "" : selectedInput?.deviceId;
   const microphonePermissionStatus = permissionStatus?.microphone.status;

   useEffect(() => {
      if (!isMobileEnvironment) return;

      let cancelled = false;
      async function initializeAndroidDevices() {
         const permissions = await NativeMediaDevices.checkOrRequestPermissions({ microphone: true, camera: true });

         if (cancelled) return;

         setPermissionStatus(permissions);
         showAndroidPermissionIssues(permissions);
         if (permissions.microphone.status === "granted" || permissions.camera.status === "granted") await refreshDevices();
      }

      void initializeAndroidDevices().catch(console.error);
      return () => {
         cancelled = true;
      };
   }, [isMobileEnvironment]);

   useCapacitorListener(
      () =>
         App.addListener("appStateChange", ({ isActive }) => {
            if (!isActive) return;
            void refreshAndroidPermissions();
         }),
      [],
   );

   useEffect(() => VoiceInputDevice.acquire(), []);

   useEffect(() => {
      let interval: ReturnType<typeof window.setTimeout> | undefined;
      let cancelled = false;

      async function startMicrophoneTest() {
         if (!client) return;
         if (isMobileEnvironment && microphonePermissionStatus !== "granted") return;

         if (cancelled) return;

         if (!microphoneDeviceId && !isMobileEnvironment) return;

         const stream = await VoiceInputDevice.getStream(microphoneDeviceId ?? "", settings.inputVolume, noiseSuppression);
         if (cancelled) return;

         const checker = new AudioLevelChecker();
         checker.onAudioLevel = onAudioLevel;
         audioLevel.current = checker;
         await checker.startChecking(stream);

         if (cancelled || audioLevel.current !== checker) {
            checker.stopChecking();
            return;
         }

         interval = setInterval(() => setInputDb(currentInputDb.current), 100);
      }

      void startMicrophoneTest().catch((error: unknown) => {
         if (!cancelled) console.error(error);
      });

      return () => {
         cancelled = true;
         clearInterval(interval);
         audioLevel.current?.stopChecking();
         audioLevel.current = null;
         currentInputDb.current = 0;
         setInputDb(0);
      };
   }, [client, isMobileEnvironment, microphoneDeviceId, microphonePermissionStatus, noiseSuppression]);

   useEffect(() => {
      VoiceInputDevice.setGain(settings.inputVolume);
   }, [settings.inputVolume]);

   useEffect(() => {
      props.onChange?.({ noiseSuppression });
   }, [noiseSuppression]);

   useEffect(() => {
      return () => {
         stopCameraTest();
      };
   }, []);

   function showAndroidPermissionIssues(permissions: MediaDevicePermissionStatus, permission?: "microphone" | "camera") {
      showPermissionIssues(
         (["microphone", "camera"] as const).filter((name) => !permission || name === permission).map((name) => ({ name, ...permissions[name] })),
      );
   }

   async function refreshAndroidPermissions() {
      const permissions = await NativeMediaDevices.getPermissionStatus();
      setPermissionStatus(permissions);
      if (permissions.camera.status !== "granted") stopCameraTest();
      if (permissions.microphone.status === "granted" || permissions.camera.status === "granted") await refreshDevices();
   }

   async function requestAndroidPermission(permission: "microphone" | "camera") {
      const permissions = await NativeMediaDevices.checkOrRequestPermissions({
         microphone: permission === "microphone",
         camera: permission === "camera",
      });
      setPermissionStatus(permissions);
      showAndroidPermissionIssues(permissions, permission);

      if (permissions[permission].status === "granted") await refreshDevices();
      return permissions[permission];
   }

   function onAudioLevel(db: number) {
      currentInputDb.current = clamp(db, -100, 100);
   }

   function onInputChange(item: SelectItem) {
      props.onChange?.({ inputDeviceId: item.value });
   }

   function onOutputChange(item: SelectItem) {
      props.onChange?.({ outputDeviceId: item.value });
   }

   function onCameraChange(item: SelectItem) {
      stopCameraTest();
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
      if (videoRef.current) videoRef.current.srcObject = null;
      videoStream.current?.getTracks().forEach((track) => track.stop());
      videoStream.current = null;
      setIsTestingCamera(false);
   }

   async function startCameraTest() {
      if (!videoRef.current) return;

      if (isMobileEnvironment) {
         let permission = permissionStatus?.camera;
         if (permission?.status !== "granted") permission = await requestAndroidPermission("camera");
         if (permission.status !== "granted") return;
      } else if (!selectedCamera) {
         return;
      }

      setIsTestingCamera(true);
      try {
         const stream = await navigator.mediaDevices.getUserMedia({
            video: {
               ...(selectedCamera ? { deviceId: selectedCamera.deviceId } : {}),
               frameRate: isMobileEnvironment ? { ideal: 30, max: 30 } : 60,
            },
         });
         videoRef.current.srcObject = stream;
         videoStream.current = stream;
         stream.getVideoTracks()[0].onended = stopCameraTest;
         if (isMobileEnvironment) await refreshDevices();
      } catch (error) {
         stopCameraTest();
         console.error(error);
      }
   }

   const thresholdSlider = (
      <HuginnSlider
         className="max-w-165"
         onChange={onInputThresholdChange}
         defaultValue={remap(settings.inputThreshold ?? -100, -100, 0, 0, 100)}
         getTooltipText={(percentage) => `${remap(percentage, 0, 100, -100, 0)}db`}
      >
         <HuginnSlider.Label>Input Threshold</HuginnSlider.Label>
         <HuginnSlider.Input backgroundClassName="bg-positive-300!" fillClassName="bg-negative-300!">
            <div
               className="bg-surface-alt/50 absolute top-0 left-0 h-full transition-all duration-100"
               style={{ width: `${remap(inputDb, -100, 0, 0, 100)}%` }}
            />
         </HuginnSlider.Input>
      </HuginnSlider>
   );

   const noiseSuppressionCheckbox = (
      <div className="flex">
         <HuginnCheckbox checked={noiseSuppression} onChange={setNoiseSuppression} className="w-45!">
            <HuginnCheckbox.Input>Noise Suppression</HuginnCheckbox.Input>
         </HuginnCheckbox>
      </div>
   );

   const cameraPreview = (
      <div className="bg-surface-deep relative flex aspect-video w-full max-w-md items-center justify-center overflow-hidden rounded-lg shadow-lg">
         {!isTestingCamera && (
            <HuginnButton color="primary" className="absolute z-1 px-4 py-2" onClick={startCameraTest}>
               Test Camera
            </HuginnButton>
         )}
         <video ref={videoRef} autoPlay playsInline muted className="w-full" />
      </div>
   );

   if (isMobileEnvironment) {
      const microphonePermission = permissionStatus?.microphone;
      const cameraPermission = permissionStatus?.camera;

      return (
         <div className="flex flex-col items-center">
            <div className="flex w-full max-w-xl flex-col gap-y-5">
               <AndroidAudioRouteSelect />

               {microphonePermission?.status === "granted" ? (
                  <>
                     <HuginnSlider
                        onChange={onInputVolumeChange}
                        defaultValue={settings.inputVolume}
                        className="w-full"
                        getTooltipText={(value) => `${value}%`}
                     >
                        <HuginnSlider.Label>Microphone Sensitivity</HuginnSlider.Label>
                        <HuginnSlider.Input />
                     </HuginnSlider>
                     {thresholdSlider}
                     {noiseSuppressionCheckbox}
                  </>
               ) : (
                  <PermissionNotice
                     name="Microphone"
                     permission={microphonePermission}
                     onRequest={async () => {
                        await requestAndroidPermission("microphone");
                     }}
                     onOpenSettings={openAppSettings}
                  />
               )}

               <div className="bg-surface-alt h-px w-full" />

               {cameraPermission?.status === "granted" ? (
                  <>
                     <HuginnSelect
                        className="w-full"
                        onChange={onCameraChange}
                        selected={cameraDeviceOptions.find((option) => option.value === selectedCamera?.deviceId)}
                     >
                        <HuginnSelect.Label>Camera</HuginnSelect.Label>
                        <HuginnSelect.List className="w-full!" placeholder={cameraDeviceOptions.length > 0 ? "Select camera" : "Default camera"}>
                           <HuginnSelect.ItemsWrapper>
                              {cameraDeviceOptions.map((option) => (
                                 <HuginnSelect.Item key={option.value} item={option} />
                              ))}
                           </HuginnSelect.ItemsWrapper>
                        </HuginnSelect.List>
                     </HuginnSelect>
                     {cameraPreview}
                  </>
               ) : (
                  <PermissionNotice
                     name="Camera"
                     permission={cameraPermission}
                     onRequest={async () => {
                        await requestAndroidPermission("camera");
                     }}
                     onOpenSettings={openAppSettings}
                  />
               )}
            </div>
         </div>
      );
   }

   return (
      <div className="flex flex-col items-center">
         <div className="flex w-full max-w-xl flex-col">
            <div className="flex w-full flex-col gap-y-5">
               <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <HuginnSelect
                     className="w-full"
                     onChange={onInputChange}
                     selected={inputDeviceOptions.find((option) => option.value === selectedInput?.deviceId)}
                  >
                     <HuginnSelect.Label>Input Device</HuginnSelect.Label>
                     <HuginnSelect.List className="w-full!">
                        <HuginnSelect.ItemsWrapper>
                           {inputDeviceOptions.map((option) => (
                              <HuginnSelect.Item key={option.value} item={option} />
                           ))}
                        </HuginnSelect.ItemsWrapper>
                     </HuginnSelect.List>
                  </HuginnSelect>
                  <HuginnSelect
                     className="w-full"
                     onChange={onOutputChange}
                     selected={outputDeviceOptions.find((option) => option.value === selectedOutput?.deviceId)}
                  >
                     <HuginnSelect.Label>Output Device</HuginnSelect.Label>
                     <HuginnSelect.List className="w-full!">
                        <HuginnSelect.ItemsWrapper>
                           {outputDeviceOptions.map((option) => (
                              <HuginnSelect.Item key={option.value} item={option} />
                           ))}
                        </HuginnSelect.ItemsWrapper>
                     </HuginnSelect.List>
                  </HuginnSelect>
               </div>
               <div className="flex flex-col gap-5 sm:flex-row">
                  <HuginnSlider
                     onChange={onInputVolumeChange}
                     defaultValue={settings.inputVolume}
                     className="max-w-xs"
                     getTooltipText={(value) => `${value}%`}
                  >
                     <HuginnSlider.Label>Input Volume</HuginnSlider.Label>
                     <HuginnSlider.Input />
                  </HuginnSlider>
                  <HuginnSlider
                     onChange={onOutputVolumeChange}
                     defaultValue={settings.outputVolume}
                     maxValue={200}
                     className="max-w-xs"
                     getTooltipText={(value) => `${value}%`}
                  >
                     <HuginnSlider.Label>Output Volume</HuginnSlider.Label>
                     <HuginnSlider.Input />
                  </HuginnSlider>
               </div>
               {thresholdSlider}
               {noiseSuppressionCheckbox}
               <div className="bg-surface-alt h-px w-full" />
               <HuginnSelect
                  className="w-full max-w-xs"
                  onChange={onCameraChange}
                  selected={cameraDeviceOptions.find((option) => option.value === selectedCamera?.deviceId)}
               >
                  <HuginnSelect.Label>Video Device</HuginnSelect.Label>
                  <HuginnSelect.List className="w-full!">
                     <HuginnSelect.ItemsWrapper>
                        {cameraDeviceOptions.map((option) => (
                           <HuginnSelect.Item key={option.value} item={option} />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
               </HuginnSelect>
               {cameraPreview}
            </div>
         </div>
      </div>
   );
}

function PermissionNotice(props: {
   name: string;
   permission?: MediaDevicePermission;
   onRequest: () => void | Promise<void>;
   onOpenSettings: () => void | Promise<void>;
}) {
   const permanentlyDenied = props.permission?.settingsRequired || props.permission?.status === "denied";
   const checking = !props.permission;

   return (
      <div className="bg-surface-alt flex flex-col gap-y-3 rounded-lg p-4">
         <div>
            <div className="text-text font-medium">{props.name} permission</div>
            <div className="text-text/70 mt-1 text-sm">
               {checking
                  ? "Checking permission…"
                  : permanentlyDenied
                    ? `${props.name} permission was permanently denied. Allow it from Android app settings.`
                    : `${props.name} permission is required. You can ask Android for permission again.`}
            </div>
         </div>
         {!checking && (
            <HuginnButton color="primary" className="w-fit px-4 py-2" onClick={permanentlyDenied ? props.onOpenSettings : props.onRequest}>
               {permanentlyDenied ? "Open Settings" : "Allow Permission"}
            </HuginnButton>
         )}
      </div>
   );
}
