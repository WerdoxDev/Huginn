import { useEditSettings } from "@hooks/mutations/useEditSettings";
import { usePrevious } from "@hooks/usePrevious";
import { useClientStore } from "@stores/clientStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, useRef, type ReactNode } from "react";

export default function SettingsProvider(props: { children?: ReactNode }) {
   const { user } = useThisUser();
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();
   const { userSettings } = useClientStore();
   const previousSettings = usePrevious(settings);
   const editSettingsMutation = useEditSettings();
   const isUpdatingFromServer = useRef(false);

   useEffect(() => {
      // Skip if this change came from syncing server data
      if (isUpdatingFromServer.current) {
         isUpdatingFromServer.current = false;
         return;
      }

      if (settings.theme !== previousSettings?.theme) {
         editSettingsMutation.mutate({ theme: settings.theme });
      }
   }, [settings]);

   useEffect(() => {
      if (!user || !userSettings?.theme) {
         return;
      }

      // Only update if the values are actually different
      if (settings.theme !== userSettings.theme) {
         isUpdatingFromServer.current = true;
         setValue("settings", { ...settings, theme: userSettings.theme });
      }
   }, [userSettings]);

   return props.children;
}
