import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import HuginnInput from "@components/input/HuginnInput";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";

import type { DropdownItem, SettingsTabProps } from "@/types";

type Inputs = {
   apiHostname: string;
   cdnHostname: string;
   voiceHostname: string;
   analyticsHostname: string;
   externalUrl: string;
};

const hostnameSources: DropdownItem[] = [
   {
      text: "Manual",
      value: "manual",
      icon: <IconMingcuteText2Fill className="text-text size-6" />,
   },
   {
      text: "External",
      value: "external",
      icon: <IconMingcuteWifiFill className="text-text size-6" />,
   },
] as const;

export default function SettingsAdvancedTab(props: SettingsTabProps) {
   const settings = useStorage("settings");
   const huginnWindow = useHuginnWindow();
   const { setValue: setStorageValue } = useStorageStore();

   // const { values, validateValues, inputsProps, setValue } = useInputs([
   //    { name: "apiHostname", required: false, default: settings.apiHostname },
   //    { name: "cdnHostname", required: false, default: settings.cdnHostname },
   //    { name: "voiceHostname", required: false, default: settings.voiceHostname },
   //    { name: "analyticsHostname", required: false, default: settings.analyticsHostname },
   //    { name: "externalUrl", required: false, default: settings.externalHostnamesUrl },
   // ]);

   const { register, values, setValue } = useHuginnForm<Inputs>({
      defaultValues: {
         voiceHostname: settings.voiceHostname,
         analyticsHostname: settings.analyticsHostname,
         apiHostname: settings.apiHostname,
         cdnHostname: settings.cdnHostname,
         externalUrl: settings.externalHostnamesUrl,
      },
   });

   const [hostnameSource, setHostnameMode] = useState<typeof settings.hostnameSource>(settings.hostnameSource);
   const _hostnameSource = useRef(hostnameSource);
   const { updateModals } = useModals();

   function validateHostnames() {
      if (values.apiHostname.endsWith("/")) setValue("apiHostname", values.apiHostname.slice(0, -1));
      if (values.cdnHostname.endsWith("/")) setValue("cdnHostname", values.cdnHostname.slice(0, -1));
      if (values.voiceHostname.endsWith("/")) setValue("voiceHostname", values.voiceHostname.slice(0, -1));
      if (values.analyticsHostname.endsWith("/")) setValue("analyticsHostname", values.analyticsHostname.slice(0, -1));
   }

   // function focusChanged(isFocused: boolean) {
   //    if (isFocused) {
   //       return;
   //    }

   //    const apiHostname = values.apiHostname.value;
   //    const cdnHostname = values.cdnHostname.value;
   //    const voiceHostname = values.voiceHostname.value;
   //    const analyticsHostname = values.analyticsHostname.value;

   //    if (apiHostname.endsWith("/")) {
   //       setValue("apiHostname", apiHostname.slice(0, -1));
   //    }
   //    if (cdnHostname.endsWith("/")) {
   //       setValue("cdnHostname", cdnHostname.slice(0, -1));
   //    }
   //    if (voiceHostname.endsWith("/")) {
   //       setValue("voiceHostname", voiceHostname.slice(0, -1));
   //    }
   //    if (analyticsHostname.endsWith("/")) {
   //       setValue("analyticsHostname", analyticsHostname.slice(0, -1));
   //    }
   // }

   function hostnameModeChanged(item: DropdownItem) {
      setHostnameMode(item.value as typeof settings.hostnameSource);
   }

   const shouldRestart = useEffectEvent(() => {
      return (
         (values.apiHostname && settings.apiHostname !== values.apiHostname) ||
         (values.cdnHostname && settings.cdnHostname !== values.cdnHostname) ||
         (values.voiceHostname && settings.voiceHostname !== values.voiceHostname) ||
         (values.analyticsHostname && settings.analyticsHostname !== values.analyticsHostname) ||
         (values.externalUrl && settings.externalHostnamesUrl !== values.externalUrl) ||
         _hostnameSource.current !== settings.hostnameSource
      );
   });

   const handleModalCallback = useEffectEvent(async () => {
      await setStorageValue("settings", {
         ...settings,
         cdnHostname: values.cdnHostname,
         apiHostname: values.apiHostname,
         voiceHostname: values.voiceHostname,
         analyticsHostname: values.analyticsHostname,
         externalHostnamesUrl: values.externalUrl,
         hostnameSource: _hostnameSource.current,
      });
      updateModals({ info: { isOpen: false } });

      if (huginnWindow.environment === "desktop") {
         window.electronAPI.relaunch();
      } else {
         location.reload();
      }
   });

   useEffect(() => {
      _hostnameSource.current = hostnameSource;
   }, [hostnameSource]);

   useEffect(() => {
      return () => {
         if (props.onChange && shouldRestart()) {
            updateModals({
               info: {
                  isOpen: true,
                  status: "info",
                  text: "Hostnames changed. The app should be restarted!",
                  title: "Hang on!",
                  action: {
                     confirm: {
                        text: "Restart",
                        callback: handleModalCallback,
                     },
                     cancel: {
                        text: "Revert",
                        callback: () => {
                           updateModals({ info: { isOpen: false } });
                        },
                     },
                  },
                  isClosable: false,
               },
            });
         }
      };
   }, [settings]);

   return (
      <div className="flex flex-col gap-y-5">
         <HuginnDropdown onChange={hostnameModeChanged} value={hostnameSources.find((x) => x.value === hostnameSource)}>
            <HuginnDropdown.Label>Hostname Source</HuginnDropdown.Label>
            <HuginnDropdown.List>
               <HuginnDropdown.ItemsWrapper className="w-52">
                  {hostnameSources.map((x) => (
                     <HuginnDropdown.Item key={x.value} item={x} />
                  ))}
               </HuginnDropdown.ItemsWrapper>
            </HuginnDropdown.List>
         </HuginnDropdown>
         {hostnameSource === "manual" ? (
            <div>
               <div className="text-text mb-2 text-xs font-medium uppercase opacity-90 select-none">Hostnames</div>
               <HuginnInput className="w-100" type="text" {...register("apiHostname", { required: true, onBlur: validateHostnames })} hideMessage>
                  <HuginnInput.Wrapper className="rounded-b-none">
                     <InputTag>api</InputTag>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               <HuginnInput
                  className="mt-px w-100"
                  type="text"
                  {...register("cdnHostname", { required: true, onBlur: validateHostnames })}
                  hideMessage
               >
                  <HuginnInput.Wrapper className="rounded-t-none rounded-b-none">
                     <InputTag>cdn</InputTag>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               <HuginnInput
                  className="mt-px w-100"
                  type="text"
                  {...register("voiceHostname", { required: true, onBlur: validateHostnames })}
                  hideMessage
               >
                  <HuginnInput.Wrapper className="rounded-t-none rounded-b-none">
                     <InputTag>voice</InputTag>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               <HuginnInput
                  className="mt-px w-100"
                  type="text"
                  {...register("analyticsHostname", { required: true, onBlur: validateHostnames })}
                  hideMessage
               >
                  <HuginnInput.Wrapper className="rounded-t-none">
                     <InputTag>analytics</InputTag>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            </div>
         ) : (
            <div>
               <HuginnInput className="w-md" type="text" {...register("externalUrl", { required: true, onBlur: validateHostnames })}>
                  <HuginnInput.Label>External Hostnames URL</HuginnInput.Label>
                  <div className="flex items-center">
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                     {/* <HuginnButton className="bg-positive-500 ml-2 p-2">
								<IconMingcuteCheckFill />
							</HuginnButton> */}
                  </div>
               </HuginnInput>
            </div>
         )}
      </div>
   );
}

function InputTag(props: { children?: ReactNode }) {
   return (
      <div className="bg-surface-deep text-text ml-2 w-20 shrink-0 rounded-sm p-1 px-1.5 text-center text-xs uppercase select-none">
         {props.children}
      </div>
   );
}
