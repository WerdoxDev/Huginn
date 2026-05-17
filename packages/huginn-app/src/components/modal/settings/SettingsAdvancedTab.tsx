import HuginnButton from "@components/button/HuginnButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnLabel from "@components/HuginnLabel";
import HuginnInput from "@components/input/HuginnInput";
import { type ConnectionStatus, useConnectionStatus } from "@hooks/useConnectionStatus";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { type ReactNode, useEffect, useEffectEvent, useRef, useState } from "react";

import type { SelectItem, HostnamePreset, SettingsTabProps } from "@/types";

type Inputs = {
   presetName: string;
   apiHostname: string;
   cdnHostname: string;
   voiceHostname: string;
   analyticsHostname: string;
   externalUrl: string;
};

const hostnameSources: SelectItem[] = [
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

   const presets = settings.hostnamePresets ?? [];
   const activePreset = presets.find((p) => p.name === settings.activePresetName) ?? null;
   const initialActivePreset = useRef(activePreset);

   const { register, values, setValue, handleSubmit, reset } = useHuginnForm<Inputs>({
      defaultValues: {
         presetName: activePreset?.name,
         voiceHostname: activePreset?.voiceHostname,
         analyticsHostname: activePreset?.analyticsHostname,
         apiHostname: activePreset?.apiHostname,
         cdnHostname: activePreset?.cdnHostname,
         externalUrl: activePreset?.externalHostnamesUrl,
      },
   });

   const [hostnameSource, setHostnameMode] = useState<"manual" | "external">(activePreset?.hostnameSource ?? "manual");
   // const _hostnameSource = useRef(hostnameSource);
   const { updateModals } = useModals();

   const [selectedPreset, setSelectedPreset] = useState<string | null>(settings.activePresetName ?? null);
   // const pendingActivePreset = useRef<string | null>(settings.activePresetName ?? null);
   const [pendingNewPresetName, setPendingNewPresetName] = useState<string | null>(null);

   const isNewPreset = pendingNewPresetName !== null && pendingNewPresetName === selectedPreset;
   const existingPreset = !isNewPreset ? presets.find((p) => p.name === selectedPreset) : null;

   const activePresetModified =
      activePreset !== null &&
      initialActivePreset.current !== null &&
      (activePreset.apiHostname !== initialActivePreset.current.apiHostname ||
         activePreset.cdnHostname !== initialActivePreset.current.cdnHostname ||
         activePreset.voiceHostname !== initialActivePreset.current.voiceHostname ||
         activePreset.analyticsHostname !== initialActivePreset.current.analyticsHostname ||
         activePreset.externalHostnamesUrl !== initialActivePreset.current.externalHostnamesUrl ||
         activePreset.hostnameSource !== initialActivePreset.current.hostnameSource);

   const needsRestart = (selectedPreset !== null && selectedPreset !== settings.activePresetName && !isNewPreset) || activePresetModified;
   const hasUnsavedChanges =
      selectedPreset !== null &&
      (isNewPreset ||
         (existingPreset != null &&
            (existingPreset.name !== values.presetName ||
               existingPreset.apiHostname !== values.apiHostname ||
               existingPreset.cdnHostname !== values.cdnHostname ||
               existingPreset.voiceHostname !== values.voiceHostname ||
               existingPreset.analyticsHostname !== values.analyticsHostname ||
               existingPreset.externalHostnamesUrl !== values.externalUrl ||
               existingPreset.hostnameSource !== hostnameSource)));

   function validateHostnames() {
      if (values.apiHostname.endsWith("/")) setValue("apiHostname", values.apiHostname.slice(0, -1));
      if (values.cdnHostname.endsWith("/")) setValue("cdnHostname", values.cdnHostname.slice(0, -1));
      if (values.voiceHostname.endsWith("/")) setValue("voiceHostname", values.voiceHostname.slice(0, -1));
      if (values.analyticsHostname.endsWith("/")) setValue("analyticsHostname", values.analyticsHostname.slice(0, -1));
   }

   function handleHostnameModeChanged(item: SelectItem) {
      setHostnameMode(item.value as "manual" | "external");
   }

   function loadPreset(name: string) {
      const preset = presets.find((p) => p.name === name);
      if (!preset) return;

      reset();

      setValue("presetName", preset.name);
      setValue("apiHostname", preset.apiHostname);
      setValue("cdnHostname", preset.cdnHostname);
      setValue("voiceHostname", preset.voiceHostname);
      setValue("analyticsHostname", preset.analyticsHostname);
      setValue("externalUrl", preset.externalHostnamesUrl);
      setHostnameMode(preset.hostnameSource);
      setSelectedPreset(name);
   }

   function getDefaultPresetName() {
      const base = "New Preset";
      const allNames = [...presets.map((p) => p.name), pendingNewPresetName].filter(Boolean);
      if (!allNames.includes(base)) return base;
      let i = 2;
      while (allNames.includes(`${base} ${i}`)) i++;
      return `${base} ${i}`;
   }

   function handleNewPresetClick() {
      const name = getDefaultPresetName();
      setPendingNewPresetName(name);
      setHostnameMode("manual");
      setValue("presetName", name);
      setValue("apiHostname", "");
      setValue("cdnHostname", "");
      setValue("voiceHostname", "");
      setValue("analyticsHostname", "");
      setValue("externalUrl", "");
      setSelectedPreset(name);
   }

   async function handleSavePreset() {
      if (!selectedPreset) return;
      const name = values.presetName.trim();
      if (!name) return;

      const preset: HostnamePreset = {
         name,
         hostnameSource: hostnameSource,
         apiHostname: values.apiHostname,
         cdnHostname: values.cdnHostname,
         voiceHostname: values.voiceHostname,
         analyticsHostname: values.analyticsHostname,
         externalHostnamesUrl: values.externalUrl,
      };

      if (pendingNewPresetName === selectedPreset) {
         await setStorageValue("settings", {
            ...settings,
            hostnamePresets: [...presets, preset],
         });
         setPendingNewPresetName(null);
      } else {
         const isRenamingActive = selectedPreset === settings.activePresetName && name !== selectedPreset;
         await setStorageValue("settings", {
            ...settings,
            ...(isRenamingActive && { activePresetName: name }),
            hostnamePresets: presets.map((p) => (p.name === selectedPreset ? preset : p)),
         });
      }
      setSelectedPreset(name);
   }

   async function handleDeletePreset(name: string) {
      if (name === pendingNewPresetName) {
         setPendingNewPresetName(null);
         if (selectedPreset === name) {
            const firstPreset = presets[0];
            if (firstPreset) {
               loadPreset(firstPreset.name);
            } else {
               setSelectedPreset(null);
            }
         }
         return;
      }

      if (presets.length === 1 && !pendingNewPresetName) return;

      updateModals({
         info: {
            isOpen: true,
            status: "info",
            title: "Delete Preset",
            text: `Are you sure you want to delete "${name}"?`,
            isClosable: true,
            action: {
               cancel: {
                  text: "Cancel",
                  callback: () => {
                     updateModals({ info: { isOpen: false } });
                  },
               },
               confirm: {
                  text: "Delete",
                  callback: async () => {
                     if (selectedPreset === name) {
                        loadPreset(presets.find((p) => p.name !== name)?.name ?? "");
                     }

                     await setStorageValue("settings", {
                        ...settings,
                        hostnamePresets: presets.filter((p) => p.name !== name),
                     });

                     updateModals({ info: { isOpen: false } });
                  },
               },
            },
         },
      });
   }

   function handleSelectPendingPreset() {
      if (selectedPreset === pendingNewPresetName) return;
      setSelectedPreset(pendingNewPresetName);
      setValue("presetName", pendingNewPresetName ?? "");
      setValue("apiHostname", "");
      setValue("cdnHostname", "");
      setValue("voiceHostname", "");
      setValue("analyticsHostname", "");
      setValue("externalUrl", "");
      setHostnameMode("manual");
   }

   function handleDeletePendingPreset() {
      if (pendingNewPresetName) handleDeletePreset(pendingNewPresetName);
   }

   const shouldRestart = useEffectEvent(() => {
      return selectedPreset !== settings.activePresetName || activePresetModified;
   });

   const handleApplyAndRestart = useEffectEvent(async () => {
      await setStorageValue("settings", {
         ...settings,
         activePresetName: selectedPreset,
      });
      updateModals({ info: { isOpen: false } });

      if (huginnWindow.environment === "desktop") {
         window.electronAPI.relaunch();
      } else {
         location.reload();
      }
   });

   const handleRevertPreset = useEffectEvent(async () => {
      if (activePresetModified && initialActivePreset.current && settings.activePresetName) {
         const original = initialActivePreset.current;
         await setStorageValue("settings", {
            ...settings,
            activePresetName: original.name,
            hostnamePresets: presets.map((p) => (p.name === settings.activePresetName ? original : p)),
         });
         reset();
         setValue("presetName", original.name);
         setValue("apiHostname", original.apiHostname);
         setValue("cdnHostname", original.cdnHostname);
         setValue("voiceHostname", original.voiceHostname);
         setValue("analyticsHostname", original.analyticsHostname);
         setValue("externalUrl", original.externalHostnamesUrl);
         setHostnameMode(original.hostnameSource);
         setSelectedPreset(original.name);
      } else if (settings.activePresetName) {
         loadPreset(settings.activePresetName);
      }
   });

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
                        callback: handleApplyAndRestart,
                     },
                     cancel: {
                        text: "Revert",
                        callback: () => {
                           handleRevertPreset();
                           updateModals({ info: { isOpen: false } });
                        },
                     },
                  },
                  isClosable: false,
               },
            });
         }
      };
   }, []);

   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-100 flex-col gap-y-5">
            <div>
               <div className="text-text mb-2 text-xs font-medium uppercase opacity-90 select-none">Presets</div>
               <div className="flex flex-wrap items-center gap-2">
                  {presets.map((p) => (
                     <PresetItem
                        key={p.name}
                        name={p.name}
                        isSelected={selectedPreset === p.name}
                        onSelect={() => loadPreset(p.name)}
                        onDelete={() => handleDeletePreset(p.name)}
                     />
                  ))}
                  {pendingNewPresetName && (
                     <PresetItem
                        name={pendingNewPresetName}
                        isSelected={selectedPreset === pendingNewPresetName}
                        isPending
                        onSelect={handleSelectPendingPreset}
                        onDelete={handleDeletePendingPreset}
                     />
                  )}
                  {!pendingNewPresetName && (
                     <HuginnButton color="primary" className="flex w-32 items-center justify-center gap-x-1 py-1" onClick={handleNewPresetClick}>
                        <IconMingcuteAddFill />
                        <span>New preset</span>
                     </HuginnButton>
                  )}
               </div>
            </div>
            {needsRestart && (
               <div className="bg-surface-alt border-caution-500 text-text/80 flex w-full items-center gap-x-2 rounded-md border px-3 py-2 text-sm">
                  <IconMingcuteInformationFill className="text-caution-300 size-6 shrink-0" />
                  <span className="flex-1">Changing the active preset requires a restart.</span>
                  <div className="flex shrink-0 gap-x-1.5">
                     <HuginnButton color="ghost" type="button" onClick={handleRevertPreset} className="cursor-pointer px-2 py-1">
                        Revert
                     </HuginnButton>
                     <HuginnButton color="caution" type="button" onClick={handleApplyAndRestart} className="rounded! px-2 py-1 text-white">
                        Restart
                     </HuginnButton>
                  </div>
               </div>
            )}
            <div className="bg-surface-alt h-px w-full" />
            <form className="flex flex-col gap-y-5" onSubmit={handleSubmit(handleSavePreset)}>
               {selectedPreset && (
                  <HuginnInput className="w-full" type="text" {...register("presetName", { required: true })}>
                     <HuginnInput.Label>Preset Name</HuginnInput.Label>
                     <HuginnInput.Wrapper>
                        <HuginnInput.Input />
                     </HuginnInput.Wrapper>
                  </HuginnInput>
               )}
               <HuginnSelect onChange={handleHostnameModeChanged} selected={hostnameSources.find((x) => x.value === hostnameSource)}>
                  <HuginnSelect.Label>Hostname Source</HuginnSelect.Label>
                  <HuginnSelect.List>
                     <HuginnSelect.ItemsWrapper className="w-52">
                        {hostnameSources.map((x) => (
                           <HuginnSelect.Item key={x.value} item={x} />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
               </HuginnSelect>
               {hostnameSource === "manual" ? (
                  <HostnameInputs values={values} register={register} validateHostnames={validateHostnames} />
               ) : (
                  <ExternalHostnameInput values={values} register={register} validateHostnames={validateHostnames} />
               )}
               {hasUnsavedChanges && (
                  <HuginnButton color="primary" type="submit" className="h-10 px-3">
                     Save
                  </HuginnButton>
               )}
            </form>
         </div>
      </div>
   );
}

function PresetItem(props: { name: string; isSelected: boolean; isPending?: boolean; onSelect: () => void; onDelete: () => void }) {
   return (
      <div
         className={clsx(
            "transition-ring flex overflow-hidden rounded-md",
            props.isSelected && (props.isPending ? "ring-caution-600 ring" : "ring-positive-600 ring"),
         )}
      >
         <HuginnButton
            color={props.isPending ? "caution" : props.isSelected ? "positive" : "surface-alt"}
            type="button"
            onClick={props.onSelect}
            className="rounded-none px-3 py-1"
         >
            {props.name}
         </HuginnButton>
         <button
            type="button"
            onClick={props.onDelete}
            className="bg-surface-deep hover:bg-negative-500 cursor-pointer px-1.5 text-white transition-colors"
         >
            <IconMingcuteCloseFill className="size-4" />
         </button>
      </div>
   );
}

function ExternalHostnameInput(props: {
   values: Inputs;
   register: ReturnType<typeof useHuginnForm<Inputs>>["register"];
   validateHostnames: () => void;
}) {
   const externalStatus = useConnectionStatus(props.values.externalUrl);

   return (
      <div>
         <HuginnInput className="w-full" type="text" {...props.register("externalUrl", { required: true, onBlur: props.validateHostnames })}>
            <HuginnInput.Label>External Hostnames URL</HuginnInput.Label>
            <HuginnInput.Wrapper>
               <HuginnInput.Input />
               <ConnectionIndicator status={externalStatus.status} onRetry={externalStatus.retry} />
            </HuginnInput.Wrapper>
         </HuginnInput>
      </div>
   );
}

function HostnameInputs(props: { values: Inputs; register: ReturnType<typeof useHuginnForm<Inputs>>["register"]; validateHostnames: () => void }) {
   const apiStatus = useConnectionStatus(props.values.apiHostname);
   const cdnStatus = useConnectionStatus(props.values.cdnHostname);
   const voiceStatus = useConnectionStatus(props.values.voiceHostname);
   const analyticsStatus = useConnectionStatus(props.values.analyticsHostname);

   return (
      <div>
         <HuginnLabel>Hostnames</HuginnLabel>
         <HuginnInput
            className="w-full"
            type="text"
            {...props.register("apiHostname", { required: true, onBlur: props.validateHostnames })}
            hideMessage
         >
            <HuginnInput.Wrapper className="rounded-b-none">
               <InputTag>api</InputTag>
               <HuginnInput.Input />
               <ConnectionIndicator status={apiStatus.status} onRetry={apiStatus.retry} />
            </HuginnInput.Wrapper>
         </HuginnInput>
         <HuginnInput
            className="mt-px w-full"
            type="text"
            {...props.register("cdnHostname", { required: true, onBlur: props.validateHostnames })}
            hideMessage
         >
            <HuginnInput.Wrapper className="rounded-t-none rounded-b-none">
               <InputTag>cdn</InputTag>
               <HuginnInput.Input />
               <ConnectionIndicator status={cdnStatus.status} onRetry={cdnStatus.retry} />
            </HuginnInput.Wrapper>
         </HuginnInput>
         <HuginnInput
            className="mt-px w-full"
            type="text"
            {...props.register("voiceHostname", { required: true, onBlur: props.validateHostnames })}
            hideMessage
         >
            <HuginnInput.Wrapper className="rounded-t-none rounded-b-none">
               <InputTag>voice</InputTag>
               <HuginnInput.Input />
               <ConnectionIndicator status={voiceStatus.status} onRetry={voiceStatus.retry} />
            </HuginnInput.Wrapper>
         </HuginnInput>
         <HuginnInput
            className="mt-px w-full"
            type="text"
            {...props.register("analyticsHostname", { required: true, onBlur: props.validateHostnames })}
            hideMessage
         >
            <HuginnInput.Wrapper className="rounded-t-none">
               <InputTag>analytics</InputTag>
               <HuginnInput.Input />
               <ConnectionIndicator status={analyticsStatus.status} onRetry={analyticsStatus.retry} />
            </HuginnInput.Wrapper>
         </HuginnInput>
      </div>
   );
}

function ConnectionIndicator(props: { status: ConnectionStatus; onRetry: () => void }) {
   if (props.status === "idle") return null;

   return (
      <div className="mr-2 flex shrink-0 items-center gap-x-1">
         {props.status === "checking" && <IconMingcuteLoading3Fill className="text-text size-4 animate-spin opacity-60" />}
         {props.status === "connected" && <IconMingcuteCheckFill className="text-positive-500 size-4" />}
         {props.status === "error" && (
            <>
               <IconMingcuteCloseFill className="text-negative-300 size-4" />
               <button type="button" onClick={props.onRetry} className="text-text hover:text-text/80 cursor-pointer transition-colors">
                  <IconMingcuteRefreshAnticlockwise1Line className="size-4" />
               </button>
            </>
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
