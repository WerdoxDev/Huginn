import { HuginnButton } from "@huginn/frontend-shared";
import { storageStore, useStorage } from "@stores/storageStore";
import { useHuginnWindow } from "@stores/windowStore";

import type { ApplicationPreferenceKey } from "@/types";

import Tooltip from "./tooltip/Tooltip";

export default function ApplicationOverlayButton(props: { applicationKey: ApplicationPreferenceKey }) {
   const preferences = useStorage("application-preferences");
   const { environment } = useHuginnWindow();
   const enabled = preferences?.[props.applicationKey]?.overlayEnabled ?? true;
   const label = enabled ? "Disable overlay" : "Enable overlay";

   if (environment !== "desktop") return null;

   async function toggleOverlay() {
      const { getCachedValue, setValue } = storageStore.getState();
      const current = getCachedValue("application-preferences");
      const preference = current?.[props.applicationKey];
      await setValue("application-preferences", {
         ...current,
         [props.applicationKey]: { ...preference, overlayEnabled: !(preference?.overlayEnabled ?? true) },
      });
   }

   return (
      <Tooltip>
         <Tooltip.Trigger asChild>
            <HuginnButton color="surface" className="shrink-0 p-1" onClick={toggleOverlay}>
               {enabled ? <IconMingcuteEyeLine className="text-positive-300 size-5" /> : <IconMingcuteEyeCloseLine className="text-text/50 size-5" />}
            </HuginnButton>
         </Tooltip.Trigger>
         <Tooltip.Content>{label}</Tooltip.Content>
      </Tooltip>
   );
}
