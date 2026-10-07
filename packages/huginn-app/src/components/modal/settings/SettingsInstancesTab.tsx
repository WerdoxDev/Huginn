import { HuginnButton, HuginnCheckbox, HuginnLabel } from "@huginn/frontend-shared";
import { defaultInstanceUrls, normalizeAccessAddress, switchInstanceTokens, validateInstanceUrls } from "@lib/instances";
import { useClient } from "@stores/clientStore";
import { clientStore } from "@stores/clientStoreState";
import { useModals } from "@stores/modalsStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import type { InstanceProfile, InstanceUrls, SettingsTabProps } from "@/types";

const urlKeys = ["api", "gateway", "cdn", "voice", "posthog", "otlp"] as const;

export default function SettingsInstancesTab(_props: SettingsTabProps) {
   const settings = useStorage("settings");
   const instances = useStorage("instances");
   const { setValue } = useStorageStore();
   const { updateModals } = useModals();
   const navigate = useNavigate();
   const client = useClient();
   const huginnWindow = useHuginnWindow();
   const [selectedId, setSelectedId] = useState(settings.currentInstanceId);
   const selected = instances.find((item) => item.id === selectedId);
   const [name, setName] = useState(selected?.name ?? "");
   const [addresses, setAddresses] = useState(selected?.accessAddresses.join("\n") ?? "");
   const [allOverrides, setAllOverrides] = useState<Record<string, Partial<InstanceUrls>>>(selected?.endpointOverrides ?? {});
   const [preferredAddress, setPreferredAddress] = useState(settings.currentAccessAddress);
   const [error, setError] = useState("");
   const [saving, setSaving] = useState(false);
   const overrides = allOverrides[preferredAddress] ?? {};

   useEffect(() => {
      setName(selected?.name ?? "");
      setAddresses(selected?.accessAddresses.join("\n") ?? "");
      setAllOverrides(selected?.endpointOverrides ?? {});
      setPreferredAddress(selected?.id === settings.currentInstanceId ? settings.currentAccessAddress : (selected?.accessAddresses[0] ?? ""));
      setError("");
   }, [selectedId]);

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
            const draftKey = Object.keys(allOverrides).find((key) => normalizeAccessAddress(key) === address);
            endpointOverrides[address] = Object.fromEntries(
               Object.entries(allOverrides[draftKey ?? address] ?? {}).filter(([, value]) => value?.trim()),
            );
            validateInstanceUrls({ ...defaultInstanceUrls(address), ...endpointOverrides[address] });
         }
         const updated = { ...selected, name: name.trim(), accessAddresses, endpointOverrides };
         await setValue(
            "instances",
            instances.map((item) => (item.id === selected.id ? updated : item)),
         );
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
      clientStore.setState({ client: undefined, isInitialized: false, readyData: undefined, readyCount: 0 });
      updateModals({ settings: { isOpen: false } });
      await navigate({ to: "/", replace: true });
   }

   async function connectToInstance() {
      const instance = await saveInstance();
      if (!instance) return;
      const preferred = preferredAddress ? normalizeAccessAddress(preferredAddress) : "";
      const address = instance.accessAddresses.includes(preferred) ? preferred : instance.accessAddresses[0];
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
      if (selected.id === settings.currentInstanceId) await activateInstance(next!, next!.accessAddresses[0]);
      else setSelectedId(settings.currentInstanceId);
      localStorage.removeItem(`instance-auth:${selected.id}`);
   }

   return (
      <div className="mx-auto flex w-full max-w-xl flex-col gap-5 text-white">
         <div>
            <HuginnLabel>Instances</HuginnLabel>
            <div className="mt-2 flex flex-wrap gap-2">
               {instances.map((instance) => (
                  <HuginnButton
                     key={instance.id}
                     type="button"
                     color={selectedId === instance.id ? "positive" : "surface-alt"}
                     onClick={() => setSelectedId(instance.id)}
                     className="rounded px-3 py-1"
                  >
                     {instance.name}
                     {instance.id === settings.currentInstanceId ? " · Current" : ""}
                  </HuginnButton>
               ))}
               <HuginnButton type="button" color="primary" onClick={() => void createInstance()} className="rounded px-3 py-1">
                  Add instance
               </HuginnButton>
            </div>
         </div>
         {selected && (
            <>
               <label className="flex flex-col gap-2 text-sm">
                  Instance name
                  <input
                     className="bg-surface-deep rounded border border-white/15 p-2 text-white"
                     value={name}
                     onChange={(event) => setName(event.target.value)}
                  />
               </label>
               <label className="flex flex-col gap-2 text-sm">
                  Access addresses, one per line
                  <textarea
                     className="bg-surface-deep min-h-24 rounded border border-white/15 p-2 text-white"
                     value={addresses}
                     onChange={(event) => setAddresses(event.target.value)}
                     placeholder={"https://a.example.com\nhttps://b.example.com"}
                  />
               </label>
               <label className="flex flex-col gap-2 text-sm">
                  Preferred address
                  <select
                     className="bg-surface-deep rounded border border-white/15 p-2 text-white"
                     value={preferredAddress}
                     onChange={(event) => setPreferredAddress(event.target.value)}
                  >
                     {addresses
                        .split(/\r?\n/)
                        .map((address) => address.trim())
                        .filter(Boolean)
                        .map((address) => (
                           <option key={address} value={address}>
                              {address}
                           </option>
                        ))}
                  </select>
               </label>
               <p className="text-text/70 text-sm">Huginn tries the preferred address first, then the others during startup.</p>
               <details className="bg-surface-alt rounded p-3">
                  <summary className="cursor-pointer">Advanced URL overrides</summary>
                  <p className="text-text/70 my-3 text-sm">
                     Leave a field empty to use discovery. Set both API and gateway to connect manually when discovery is unavailable.
                  </p>
                  <div className="flex flex-col gap-3">
                     {urlKeys.map((key) => (
                        <label key={key} className="flex flex-col gap-1 text-sm">
                           <span className="uppercase">{key}</span>
                           <input
                              className="bg-surface-deep rounded border border-white/15 p-2 text-white"
                              type="url"
                              value={overrides[key] ?? ""}
                              onChange={(event) =>
                                 setAllOverrides({ ...allOverrides, [preferredAddress]: { ...overrides, [key]: event.target.value } })
                              }
                           />
                        </label>
                     ))}
                  </div>
               </details>
               {error && <p className="text-negative-300 text-sm">{error}</p>}
               <div className="flex flex-wrap gap-2">
                  <HuginnButton type="button" color="primary" disabled={saving} onClick={() => void saveInstance()} className="rounded px-4 py-2">
                     Save
                  </HuginnButton>
                  <HuginnButton
                     type="button"
                     color="positive"
                     disabled={saving}
                     onClick={() => void connectToInstance()}
                     className="rounded px-4 py-2"
                  >
                     Connect
                  </HuginnButton>
                  {instances.length > 1 && (
                     <HuginnButton type="button" color="negative" onClick={() => void deleteInstance()} className="rounded px-4 py-2">
                        Delete
                     </HuginnButton>
                  )}
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
