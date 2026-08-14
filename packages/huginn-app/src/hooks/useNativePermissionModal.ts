import { useModals } from "@stores/modalsStore";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { useCallback } from "react";

export type NativePermissionIssue = {
   name: string;
   status: "granted" | "partial" | "prompt" | "denied_once" | "denied";
   settingsRequired?: boolean;
};

function formatNames(names: string[]) {
   if (names.length === 1) return names[0];
   if (names.length === 2) return `${names[0]} and ${names[1]}`;
   return `${names.slice(0, -1).join(", ")}, and ${names.at(-1)}`;
}

export function useNativePermissionModal() {
   const { updateModals } = useModals();

   const openAppSettings = useCallback(async () => {
      await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
   }, []);

   const showPermissionIssues = useCallback(
      (permissions: NativePermissionIssue[]) => {
         const permanentlyDenied = permissions.filter((permission) => permission.settingsRequired || permission.status === "denied");
         const deniedOnce = permissions.filter((permission) => permission.status === "denied_once" && !permission.settingsRequired);

         if (permanentlyDenied.length === 0 && deniedOnce.length === 0) return false;

         const permanentNames = formatNames(permanentlyDenied.map((permission) => permission.name));
         const deniedOnceNames = formatNames(deniedOnce.map((permission) => permission.name));
         const issueCount = permanentlyDenied.length + deniedOnce.length;
         const text = [
            permanentlyDenied.length > 0
               ? `Huginn can no longer ask for ${permanentNames} ${permanentlyDenied.length === 1 ? "permission" : "permissions"}. Allow ${permanentlyDenied.length === 1 ? "it" : "them"} from app settings.`
               : undefined,
            deniedOnce.length > 0
               ? `${deniedOnceNames[0].toUpperCase()}${deniedOnceNames.slice(1)} ${deniedOnce.length === 1 ? "permission was" : "permissions were"} denied. You can try again from this screen.`
               : undefined,
         ]
            .filter(Boolean)
            .join(" ");

         updateModals({
            info: {
               isOpen: true,
               title: permanentlyDenied.length > 0 ? "Settings needed" : issueCount === 1 ? "Permission denied" : "Permissions denied",
               text,
               status: "error",
               action:
                  permanentlyDenied.length > 0
                     ? {
                          confirm: {
                             text: "Open settings",
                             callback: async () => {
                                await openAppSettings();
                                updateModals({ info: { isOpen: false } });
                             },
                          },
                       }
                     : undefined,
            },
         });
         return true;
      },
      [openAppSettings, updateModals],
   );

   return { openAppSettings, showPermissionIssues };
}
