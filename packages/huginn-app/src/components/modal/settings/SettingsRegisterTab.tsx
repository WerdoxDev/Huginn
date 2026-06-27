import type { ProcessInfo } from "native-addon";

import HuginnButton from "@components/button/HuginnButton";
import CustomApplicationItem from "@components/CustomApplicationItem";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import { ProfileActivity } from "@components/profile/ProfileComponents";
import { useModals } from "@stores/modalsStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useStorage, useStorageStore } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useEffect, useMemo, useState } from "react";

import type { SelectItem, SettingsTabProps } from "@/types";

type OpenApplication = ProcessInfo & { displayName?: string; icon?: string };

export default function SettingsRegisterTab(_props: SettingsTabProps) {
   const { thisPresence } = usePresenceStore();
   const { user } = useThisUser();
   const [openApplications, setOpenApplications] = useState<OpenApplication[]>([]);
   const [selectedApplication, setSelectedApplication] = useState<SelectItem>();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();
   const targetActivity = thisPresence.activities[0];
   const customApplications = useStorage("custom-applications");
   const { setValue } = useStorageStore();
   const accentColor = user?.accentColor ?? "transparent";

   const applicationOptions = useMemo(
      () =>
         openApplications.map((x) => ({
            id: Math.random(),
            value: x.processId.toString(),
            text: x.windowTitle,
            icon: x.icon ? (
               <img src={x.icon} className="aspect-square size-6 shrink-0" />
            ) : (
               <div className="size-6 shrink-0 rounded-sm bg-white/50" />
            ),
         })),
      [openApplications],
   );

   useEffect(() => {
      if (huginnWindow.environment !== "desktop") {
         return;
      }

      const timer = setInterval(async () => {
         await fetchOpenApplications();
      }, 5000);

      fetchOpenApplications();

      return () => {
         clearInterval(timer);
      };
   }, []);

   async function fetchOpenApplications() {
      const applications: OpenApplication[] = await window.electronAPI.getOpenApplications();
      for (const application of applications) {
         const info = await window.electronAPI.getApplicationInfo(application.exePath, application.processId);
         application.displayName = info.displayName;
         application.icon = info.icon;
      }
      setOpenApplications(applications);
   }

   function onApplicationChanged(value: SelectItem) {
      setSelectedApplication(value);
   }

   async function add() {
      const application = openApplications.find((x) => x.processId === Number(selectedApplication?.value));

      if (!application) {
         return;
      }

      if (customApplications.some((x) => x.exePath === application.exePath)) {
         updateModals({
            info: {
               status: "error",
               title: "Failed!",
               text: "This application is already added!",
               isOpen: true,
            },
         });
         return;
      }

      await setValue("custom-applications", [
         ...customApplications,
         { exePath: application.exePath, title: application.windowTitle, isEnabled: true },
      ]);
   }

   async function deleteApplication(exePath: string) {
      await setValue(
         "custom-applications",
         customApplications.filter((x) => x.exePath !== exePath),
      );
   }

   async function editApplication(exePath: string, title: string) {
      const applications = [...customApplications];
      const target = applications.find((x) => x.exePath === exePath);

      if (!target) {
         return;
      }

      target.title = title;
      await setValue("custom-applications", applications);
   }

   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-md flex-col gap-y-5">
            <div className="flex flex-col">
               <div className="text-text/90 mb-2 text-xs font-medium uppercase select-none">Current Activity</div>
               {!targetActivity ? (
                  <div className="bg-surface-alt rounded-lg p-3">
                     <div className="text-text/80">No activities detected...</div>
                  </div>
               ) : (
                  <ProfileActivity activity={targetActivity} accentColor={accentColor} className="bg-surface-alt" />
               )}
            </div>
            {huginnWindow.environment === "desktop" && (
               <div className="flex flex-col">
                  <div className="text-text/90 mb-2 text-xs font-medium uppercase select-none">Register Application</div>
                  <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                     <div className="text-text/80 text-sm">Add a custom application to be shown on your profile as your activity</div>
                     <HuginnSelect onChange={onApplicationChanged} selected={selectedApplication}>
                        <HuginnSelect.List className="bg-surface-deep w-full! rounded-md!" placeholder="Select an application">
                           <HuginnSelect.ItemsWrapper>
                              {applicationOptions.map((x) => (
                                 <HuginnSelect.Item key={x.value} item={x} />
                              ))}
                           </HuginnSelect.ItemsWrapper>
                        </HuginnSelect.List>
                     </HuginnSelect>
                     <HuginnButton onClick={add} color="primary" className="h-8" disabled={!selectedApplication}>
                        Register
                     </HuginnButton>
                  </div>
               </div>
            )}
            <div className="flex flex-col">
               <div className="text-text/90 mb-2 text-xs font-medium uppercase select-none">Registered Applications</div>
               <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3 pl-2">
                  {customApplications.length === 0 ? (
                     <div className="text-text/80">No applications registered...</div>
                  ) : (
                     customApplications.map((x) => (
                        <CustomApplicationItem key={x.exePath} application={x} onDelete={deleteApplication} onTitleChanged={editApplication} />
                     ))
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
