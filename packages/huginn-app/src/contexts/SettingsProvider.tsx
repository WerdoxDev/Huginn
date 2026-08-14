import { useEditSettings } from "@hooks/mutations/useEditSettings";
import { usePrevious } from "@hooks/usePrevious";
import { oklchToHex } from "@huginnjs/shared";
import { PushNotifications } from "@lib/capacitor/push-notification-plugin";
import { useClientStore } from "@stores/clientStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useRef, type ReactNode } from "react";

import * as palette from "@/assets/palettes.json";

export default function SettingsProvider(props: { children?: ReactNode }) {
   const { user } = useThisUser();
   const settings = useStorage("settings");
   const { setValue } = useStorageStore();
   const { userSettings } = useClientStore();
   const previousSettings = usePrevious(settings);
   const editSettingsMutation = useEditSettings();
   const isUpdatingFromServer = useRef(false);
   const huginnWindow = useHuginnWindow();

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

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      void PushNotifications.setNotificationsEnabled({ enabled: settings.isNotificationsEnabled });
   }, [huginnWindow.environment, settings.isNotificationsEnabled]);

   useEffect(() => {
      if (huginnWindow.environment !== "android") return;

      void PushNotifications.setDefaultNotificationColor({ color: oklchToHex(palette["primary"][settings.theme]["primary-500"]) });
   }, [huginnWindow.environment, settings.theme]);

   return props.children;
}
