import { useEditSettings } from "@hooks/mutations/useEditSettings";
import { usePrevious } from "@hooks/usePrevious";
import { useClientStore } from "@stores/clientStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, type ReactNode } from "react";

export default function SettingsProvider(props: { children?: ReactNode }) {
   const { user } = useThisUser();
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();
   const { userSettings } = useClientStore();
   const previousSettings = usePrevious(settings);
   const editSettingsMutation = useEditSettings();

   useEffect(() => {
      if (settings.theme !== previousSettings?.theme) {
         editSettingsMutation.mutate({ theme: settings.theme });
      }
   }, [settings]);

   useEffect(() => {
      if (!user) {
         return;
      }

      if (!userSettings) {
         return;
      }

      if (userSettings.theme) {
         setValue("settings", { ...settings, theme: userSettings.theme });
      }
   }, [userSettings]);

   useEffect(() => {});

   return props.children;
}
