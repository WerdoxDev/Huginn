import type { CustomApplication, DropdownItem, SettingsTabProps } from "@/types";
import HuginnButton from "@components/button/HuginnButton";
import CustomApplicationItem from "@components/CustomApplicationItem";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import Tooltip from "@components/tooltip/Tooltip";
import { useElapsedTime } from "@hooks/useElapsedTime";
import { useFilesStore } from "@stores/filesStore";
import { useModals } from "@stores/modalsStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import moment from "moment";
import type { ProcessInfo } from "native-addon";
import { useEffect, useMemo, useState } from "react";

type OpenApplication = ProcessInfo & { displayName?: string; icon?: string };

export default function SettingsCustomTab(_props: SettingsTabProps) {
   const { thisPresence } = usePresenceStore();
   const [openApplications, setOpenApplications] = useState<OpenApplication[]>([]);
   const [selectedApplication, setSelectedApplication] = useState<DropdownItem>();
   const huginnWindow = useHuginnWindow();
   const { updateModals } = useModals();
   const targetActivity = thisPresence.activities[0];
   const { customApplications, setCustomApplications, saveCustomApplications } = useFilesStore();

   const { getFormattedDuration } = useElapsedTime(targetActivity?.createdAt);

   const applicationOptions = useMemo(
      () =>
         openApplications.map((x) => ({
            id: Math.random(),
            value: x.processId.toString(),
            text: x.windowTitle,
            icon: x.icon ? <img src={x.icon} className="aspect-square size-6 shrink-0" /> : <div className="size-6 shrink-0 rounded-sm bg-white/50" />,
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

   function onApplicationChanged(value: DropdownItem) {
      setSelectedApplication(value);
   }

   async function add() {
      const application = openApplications.find((x) => x.processId === Number(selectedApplication?.value));

      if (!application) {
         return;
      }

      if (customApplications.some((x) => x.exePath === application.exePath)) {
         updateModals({ info: { status: "error", title: "Failed!", text: "This application is already added!", isOpen: true } });
         return;
      }

      setCustomApplications([...customApplications, { exePath: application.exePath, title: application.windowTitle, isEnabled: true }]);
      await saveCustomApplications();
   }

   async function deleteApplication(exePath: string) {
      setCustomApplications(customApplications.filter((x) => x.exePath !== exePath));
      await saveCustomApplications();
   }

   async function editApplication(exePath: string, title: string) {
      const applications = [...customApplications];
      const target = applications.find((x) => x.exePath === exePath);

      if (!target) {
         return;
      }

      target.title = title;
      setCustomApplications(applications);
      await saveCustomApplications();
   }

   return (
      <div className="flex flex-col gap-y-5">
         <div className="flex w-max flex-col">
            <div className="text-text/90 mb-2 select-none text-xs font-medium uppercase">Current Activity</div>
            <div className={clsx("rounded-lg p-3", targetActivity ? "bg-primary-700" : "bg-surface-alt")}>
               {!targetActivity ? (
                  <div className="text-text/80">No activities detected...</div>
               ) : (
                  <div className="flex items-start gap-x-3">
                     <img src={targetActivity.iconUrl} className="size-10 rounded-md" />
                     <div className="flex flex-col">
                        <div className="font-semibold text-white">{targetActivity.name}</div>
                        <div className="text-positive-100 flex items-center gap-x-1 text-sm">
                           <IconMingcuteGame2Fill />
                           <div className="font-semibold">{getFormattedDuration()}</div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
         {huginnWindow.environment === "desktop" && (
            <div className="flex max-w-md flex-col">
               <div className="text-text/90 mb-2 select-none text-xs font-medium uppercase">Add Application</div>
               <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                  <div className="text-text/80 text-sm">Add a custom application to be shown on your profile as your activity</div>
                  <HuginnDropdown onChange={onApplicationChanged} value={selectedApplication}>
                     <HuginnDropdown.List className="bg-surface-deep w-full !rounded-md" placeholder="Select an application">
                        <HuginnDropdown.ItemsWrapper className="w-(--button-width)">
                           {applicationOptions.map((x) => (
                              <HuginnDropdown.Item key={x.value} item={x} />
                           ))}
                        </HuginnDropdown.ItemsWrapper>
                     </HuginnDropdown.List>
                  </HuginnDropdown>
                  <HuginnButton onClick={add} color="primary" className="h-8" disabled={!selectedApplication}>
                     Register
                  </HuginnButton>
               </div>
            </div>
         )}
         <div className="flex max-w-lg flex-col">
            <div className="text-text/90 mb-2 select-none text-xs font-medium uppercase">Custom Applications</div>
            <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3 pl-2">
               {customApplications.length === 0 ? (
                  <div className="text-text/80">No custom applications registered...</div>
               ) : (
                  customApplications.map((x) => <CustomApplicationItem key={x.exePath} application={x} onDelete={deleteApplication} onTitleChanged={editApplication} />)
               )}
            </div>
         </div>
      </div>
   );
}
