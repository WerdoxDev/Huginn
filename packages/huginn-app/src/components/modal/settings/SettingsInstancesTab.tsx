import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnAccordion from "@components/HuginnAccordion";
import { HuginnButton, HuginnCheckbox, HuginnInput, HuginnLabel, HuginnTextArea } from "@huginn/frontend-shared";
import { defaultInstanceUrls, normalizeAccessAddress, switchInstanceTokens, validateInstanceUrls } from "@lib/instances";
import { useClient } from "@stores/clientStore";
import { clientStore } from "@stores/clientStoreState";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { clearUserStore } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useNavigate } from "@tanstack/react-router";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import type { InstanceProfile, InstanceUrls, SettingsTabProps } from "@/types";

const urlKeys = ["api", "gateway", "cdn", "voice", "posthog", "otlp"] as const;

function comparableOverrides(overrides?: Record<string, Partial<InstanceUrls>>) {
   return Object.entries(overrides ?? {})
      .flatMap(([address, urls]) =>
         Object.entries(urls)
            .filter(([, value]) => value?.trim())
            .map(([key, value]) => `${address}:${key}:${value.trim()}`),
      )
      .sort()
      .join("\n");
}

export default function SettingsInstancesTab(_props: SettingsTabProps) {
   const settings = useStorage("settings");
   const instances = useStorage("instances");
   const { setValue } = useStorageStore();
   const { updateModals } = useModals();
   const navigate = useNavigate();
   const client = useClient();
   const huginnWindow = useHuginnWindow();
   const [selectedId, setSelectedId] = useState(settings.currentInstanceId);
   const selected = useMemo(() => instances.find((item) => item.id === selectedId), [instances, selectedId]);
   const loadedSelectedId = useRef<string | undefined>(undefined);
   const [name, setName] = useState(selected?.name ?? "");
   const [addresses, setAddresses] = useState(selected?.accessAddresses.join("\n") ?? "");
   const [allOverrides, setAllOverrides] = useState<Record<string, Partial<InstanceUrls>>>(selected?.endpointOverrides ?? {});
   const [preferredAddress, setPreferredAddress] = useState(settings.currentAccessAddress);
   const [error, setError] = useState("");
   const [saving, setSaving] = useState(false);
   const overrides = allOverrides[preferredAddress] ?? {};
   const addressOptions = [
      ...new Set(
         addresses
            .split(/\r?\n/)
            .map((address) => address.trim())
            .filter(Boolean),
      ),
   ].map((address) => ({
      text: address,
      value: address,
   }));

   const isModified = useMemo(() => {
      if (!selected) return false;
      const currentAddresses = addresses
         .split(/\r?\n/)
         .map((line) => line.trim())
         .filter(Boolean);

      const addressesChanged =
         currentAddresses.length !== selected.accessAddresses.length ||
         !currentAddresses.every((address, index) => address === selected.accessAddresses[index]);
      const nameChanged = name.trim() !== selected.name;
      const overridesChanged = comparableOverrides(allOverrides) !== comparableOverrides(selected.endpointOverrides);
      const savedPreferred =
         selected.id === settings.currentInstanceId
            ? settings.currentAccessAddress
            : (selected.preferredAddress ?? selected.accessAddresses[0] ?? "");
      const preferredChanged = preferredAddress !== savedPreferred;

      return addressesChanged || nameChanged || overridesChanged || preferredChanged;
   }, [name, addresses, allOverrides, preferredAddress, selected, settings.currentInstanceId, settings.currentAccessAddress]);

   const updateSelected = useCallback(
      (instance?: InstanceProfile) => {
         setAddresses(instance?.accessAddresses.join("\n") ?? "");
         setName(instance?.name ?? "");
         setAllOverrides(instance?.endpointOverrides ?? {});
         setPreferredAddress(
            instance?.id === settings.currentInstanceId
               ? settings.currentAccessAddress
               : (instance?.preferredAddress ?? instance?.accessAddresses[0] ?? ""),
         );
         setError("");
      },
      [settings.currentInstanceId, settings.currentAccessAddress],
   );

   useEffect(() => {
      if (!selected || loadedSelectedId.current === selectedId) return;
      loadedSelectedId.current = selectedId;
      updateSelected(selected);
   }, [selected, selectedId, updateSelected]);

   async function createInstance() {
      const instance: InstanceProfile = { id: crypto.randomUUID(), name: "New instance", accessAddresses: [] };
      await setValue("instances", [...instances, instance]);
      setSelectedId(instance.id);
   }

   async function saveInstance(): Promise<InstanceProfile | undefined> {
      if (!selected) return;
      setError("");
      setSaving(true);
      try {
         const accessAddresses = [
            ...new Set(
               addresses
                  .split(/\r?\n/)
                  .map((line) => line.trim())
                  .filter(Boolean)
                  .map(normalizeAccessAddress),
            ),
         ];
         if (!name.trim()) throw new Error("Enter an instance name");
         if (!accessAddresses.length) throw new Error("Add at least one access address");
         const endpointOverrides: Record<string, Partial<InstanceUrls>> = {};
         for (const address of accessAddresses) {
            const draftKey = Object.keys(allOverrides).find((key) => {
               try {
                  return normalizeAccessAddress(key) === address;
               } catch {
                  return false;
               }
            });
            endpointOverrides[address] = Object.fromEntries(
               Object.entries(allOverrides[draftKey ?? address] ?? {}).filter(([, value]) => value?.trim()),
            );
            validateInstanceUrls({ ...defaultInstanceUrls(address), ...endpointOverrides[address] });
         }
         let preferred = accessAddresses[0];
         try {
            const normalizedPreferred = normalizeAccessAddress(preferredAddress);
            if (accessAddresses.includes(normalizedPreferred)) preferred = normalizedPreferred;
         } catch {
            // An address removed from the list falls back to the first saved address.
         }
         const updated = { ...selected, name: name.trim(), accessAddresses, preferredAddress: preferred, endpointOverrides };
         await setValue(
            "instances",
            instances.map((item) => (item.id === selected.id ? updated : item)),
         );
         if (selected.id === settings.currentInstanceId && preferred !== settings.currentAccessAddress) {
            await setValue("settings", { ...settings, currentAccessAddress: preferred });
         }
         setName(updated.name);
         setAddresses(accessAddresses.join("\n"));
         setAllOverrides(endpointOverrides);
         setPreferredAddress(preferred);
         return updated;
      } catch (cause) {
         setError(cause instanceof Error ? cause.message : "Could not save instance");
      } finally {
         setSaving(false);
      }
   }

   async function activateInstance(instance: InstanceProfile, address: string) {
      switchInstanceTokens(settings.currentInstanceId, instance.id);
      await setValue("settings", {
         ...settings,
         currentInstanceId: instance.id,
         currentAccessAddress: address,
         currentUrls: { ...defaultInstanceUrls(address), ...instance.endpointOverrides?.[address] },
      });
      client?.voice.signaling.close();
      client?.gateway.close();
      clearUserStore();
      clientStore.setState({ client: undefined, isInitialized: false, readyData: undefined, readyCount: 0 });
      updateModals({ settings: { isOpen: false } });
      await navigate({ to: "/", replace: true });
   }

   async function connectToInstance() {
      const instance = await saveInstance();
      if (!instance) return;
      const address = instance.preferredAddress ?? instance.accessAddresses[0];
      await activateInstance(instance, address);
   }

   async function deleteInstance() {
      if (!selected || instances.length < 2) return;
      const remaining = instances.filter((item) => item.id !== selected.id);
      const next = remaining.find((item) => item.accessAddresses.length > 0);
      if (selected.id === settings.currentInstanceId && !next) {
         setError("Save another instance with an access address before deleting the current one");
         return;
      }
      await setValue("instances", remaining);
      if (selected.id === settings.currentInstanceId) await activateInstance(next!, next!.preferredAddress ?? next!.accessAddresses[0]);
      else setSelectedId(settings.currentInstanceId);
      localStorage.removeItem(`instance-auth:${selected.id}`);
   }

   return (
      <div className="mx-auto flex w-full max-w-lg flex-col gap-5 text-white">
         <div>
            <HuginnLabel>Instances</HuginnLabel>
            <div className="mt-2 flex flex-wrap gap-2">
               {instances.map((instance) => (
                  <HuginnButton
                     key={instance.id}
                     type="button"
                     color={selectedId === instance.id ? "primary" : "surface-alt"}
                     onClick={() => setSelectedId(instance.id)}
                     className="flex h-8 items-center justify-center gap-x-2 px-3 text-sm"
                  >
                     <div>{instance.name}</div>
                     {instance.id === settings.currentInstanceId && <IconMingcuteCheckFill className="size-5" />}
                  </HuginnButton>
               ))}
               <HuginnButton type="button" color="surface-alt" onClick={() => void createInstance()} className="h-8 px-3 text-sm">
                  Add instance
               </HuginnButton>
            </div>
         </div>
         {selected && (
            <>
               <HuginnInput value={name} onChange={(event) => setName(event.target.value)}>
                  <HuginnInput.Label>Instance name</HuginnInput.Label>
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>
               <HuginnTextArea
                  value={addresses}
                  placeholder={"https://a.example.com\nhttps://b.example.com"}
                  onChange={(event) => setAddresses(event.target.value)}
               >
                  <HuginnTextArea.Label>Access addresses</HuginnTextArea.Label>
                  <HuginnTextArea.Wrapper>
                     <HuginnTextArea.TextArea rows={3} />
                  </HuginnTextArea.Wrapper>
               </HuginnTextArea>
               <HuginnSelect
                  selected={addressOptions.find((option) => option.value === preferredAddress)}
                  onChange={(option) => setPreferredAddress(option.value)}
               >
                  <HuginnSelect.Label>Preferred address</HuginnSelect.Label>
                  <HuginnSelect.List className="w-full!" placeholder="Select an address">
                     <HuginnSelect.ItemsWrapper>
                        {addressOptions.map((option) => (
                           <HuginnSelect.Item key={option.value} item={option} />
                        ))}
                     </HuginnSelect.ItemsWrapper>
                  </HuginnSelect.List>
                  <p className="text-text/70 mt-1 text-sm">Huginn tries the preferred address first, then the others during startup.</p>
               </HuginnSelect>
               <HuginnAccordion>
                  <HuginnAccordion.Item value="advanced" className="bg-surface-alt rounded-lg p-3">
                     <HuginnAccordion.Header>
                        <HuginnAccordion.Trigger className="group flex w-full cursor-pointer items-center text-left text-sm font-medium text-white">
                           Advanced URL overrides
                           <IconMingcuteDownFill className="text-primary-500 ml-auto size-6 transition-transform group-data-panel-open:rotate-180" />
                        </HuginnAccordion.Trigger>
                     </HuginnAccordion.Header>
                     <HuginnAccordion.Panel>
                        <div className="mt-0 flex flex-col gap-5 px-1 py-2">
                           <div className="bg-caution-900 flex items-center gap-x-2 rounded-md px-2 py-1">
                              <IconMingcuteInformationFill className="text-caution-300 size-6 shrink-0" />
                              <div className="text-sm text-white/80">
                                 Overrides replace discovered URLs. If discovery is unavailable, provide at least both API and gateway URLs to connect
                                 manually.
                              </div>
                           </div>

                           <div className="flex flex-col gap-1">
                              {urlKeys.map((key) => (
                                 <HuginnInput
                                    key={key}
                                    type="url"
                                    value={overrides[key] ?? ""}
                                    onChange={(event) =>
                                       setAllOverrides({ ...allOverrides, [preferredAddress]: { ...overrides, [key]: event.target.value } })
                                    }
                                 >
                                    <HuginnInput.Wrapper className="bg-surface-deep! divide-surface divide-x-2 overflow-hidden">
                                       <div className="bg-surface-deep flex h-10 w-28 items-center justify-center text-sm">{key.toUpperCase()}</div>
                                       <HuginnInput.Input />
                                    </HuginnInput.Wrapper>
                                 </HuginnInput>
                              ))}
                           </div>
                        </div>
                     </HuginnAccordion.Panel>
                  </HuginnAccordion.Item>
               </HuginnAccordion>
               {error && (
                  <p role="alert" className="text-negative-300 text-sm">
                     {error}
                  </p>
               )}
               <div className="flex flex-col gap-2 lg:flex-row">
                  {isModified && (
                     <div className="flex w-full gap-2 lg:w-auto">
                        <HuginnButton
                           type="button"
                           color="primary"
                           disabled={saving}
                           onClick={() => void saveInstance()}
                           className="h-8 w-full lg:w-auto lg:px-4"
                        >
                           Save
                        </HuginnButton>
                        <HuginnButton
                           type="button"
                           color="surface-alt"
                           disabled={saving}
                           onClick={() => updateSelected(selected)}
                           className="h-8 w-full lg:w-auto lg:px-4"
                        >
                           Revert
                        </HuginnButton>
                     </div>
                  )}
                  <div className="flex w-full gap-2 lg:ml-auto lg:w-auto">
                     <HuginnButton
                        type="button"
                        color="primary"
                        disabled={saving}
                        onClick={() => void connectToInstance()}
                        className="h-8 w-full lg:w-auto lg:px-4"
                     >
                        Connect
                     </HuginnButton>
                     {instances.length > 1 && (
                        <HuginnButton type="button" color="negative" onClick={() => void deleteInstance()} className="h-8 w-full lg:w-auto lg:px-4">
                           Delete
                        </HuginnButton>
                     )}
                  </div>
               </div>
            </>
         )}
         {huginnWindow.environment === "desktop" && (
            <HuginnCheckbox checked={settings.useProxy} onChange={(value) => void setValue("settings", { ...settings, useProxy: value })}>
               <HuginnCheckbox.Input>Use System Proxy</HuginnCheckbox.Input>
            </HuginnCheckbox>
         )}
      </div>
   );
}
