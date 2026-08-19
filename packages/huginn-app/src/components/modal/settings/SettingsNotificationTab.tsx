import HuginnCheckbox from "@components/HuginnCheckbox";
import { useStorage } from "@stores/storageStore";

import type { SettingsTabProps } from "@/types";

export default function SettingsNotificationTab(props: SettingsTabProps) {
   const settings = useStorage("settings");

   function handleChangeNotifications(checked: boolean) {
      props.onChange?.({ isNotificationsEnabled: checked });
   }

   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-md flex-col items-center gap-8">
            <HuginnCheckbox checked={settings.isNotificationsEnabled} onChange={handleChangeNotifications} className="w-full">
               <HuginnCheckbox.Input>Enable Notifications</HuginnCheckbox.Input>
            </HuginnCheckbox>
         </div>
      </div>
   );
}
