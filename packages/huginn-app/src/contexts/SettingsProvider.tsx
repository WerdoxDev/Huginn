import { useEditSettings } from "@hooks/mutations/useEditSettings";
import { usePrevious } from "@hooks/usePrevious";
import { useClientStore } from "@stores/clientStore";
import { useFilesStore } from "@stores/filesStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useThisUser } from "@stores/userStore";
import { useEffect, type ReactNode } from "react";

export default function SettingsProvider(props: { children?: ReactNode }) {
   const { user } = useThisUser();
   const { settings, saveSettings, setSettings } = useFilesStore();
   const { userSettings } = useClientStore();
   const previousSettings = usePrevious(settings);
   const editSettingsMutation = useEditSettings();
   const { updatePresence } = usePresenceStore();

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
         setSettings({ theme: userSettings.theme });
         saveSettings();
      }

      updatePresence(user.id, { status: userSettings.status });
   }, [userSettings]);

   useEffect(() => {});

   return props.children;
}
