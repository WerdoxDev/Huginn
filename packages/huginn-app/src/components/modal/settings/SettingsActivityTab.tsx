import type { DropdownItem, SettingsTabProps } from "@/types";
import LoadingButton from "@components/button/LoadingButton";
import HuginnDropdown from "@components/dropdown/HuginnDropdown";
import Tooltip from "@components/tooltip/Tooltip";
import { useSubmitKnownApplication } from "@hooks/mutations/useSubmitKnownApplication";
import { JsonCode } from "@huginn/shared";
import { APIMessages } from "@lib/error-messages";
import { isWorthyHuginnError } from "@lib/utils";
import { useFilesStore } from "@stores/filesStore";
import { useModals } from "@stores/modalsStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import moment, { type Duration } from "moment";
import type { ProcessInfo } from "native-addon";
import { useEffect, useMemo, useState } from "react";

type OpenApplication = ProcessInfo & { displayName?: string; icon?: string };

export default function SettingsActivityTab(_props: SettingsTabProps) {
   const { thisPresence } = usePresenceStore();
   const [currentTime, setCurrentTime] = useState(new Date());
   const [openApplications, setOpenApplications] = useState<OpenApplication[]>([]);
   const { knownApplications } = useFilesStore();
   const [selectedApplication, setSelectedApplication] = useState<DropdownItem>();
   const [applicationOptions, setApplicationOptions] = useState<DropdownItem[]>([]);
   const submitMutation = useSubmitKnownApplication();
   const { user } = useThisUser();
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();

   const contributedApplications = useMemo(
      () => knownApplications.applications.filter((x) => x.contributorId === user?.id),
      [user, knownApplications],
   );

   const targetActivity = thisPresence.activities[0];

   useEffect(() => {
      const timer = setInterval(() => {
         setCurrentTime(new Date());
      }, 1000);

      if (huginnWindow.environment !== "desktop") {
         return;
      }

      const timer2 = setInterval(async () => {
         await fetchOpenApplications();
      }, 5000);

      fetchOpenApplications();

      return () => {
         clearInterval(timer);

         if (timer2) {
            clearInterval(timer2);
         }
      };
   }, []);

   async function fetchOpenApplications() {
      const applications: OpenApplication[] = await window.electronAPI.getOpenApplications();
      for (const application of applications) {
         const info = await window.electronAPI.getApplicationInfo(application.exePath, application.processId);
         application.displayName = info.displayName;
         application.icon = info.icon;
      }

      const options = applications.map((x) => ({
         id: Math.random(),
         value: x.processId.toString(),
         text: x.windowTitle,
         icon: x.icon ? <img src={x.icon} className="aspect-square size-6 shrink-0" /> : <div className="size-6 shrink-0 rounded-sm bg-white/50" />,
      }));

      setApplicationOptions(options);
      setSelectedApplication((old) => options.find((x) => x.value === old?.value));
      setOpenApplications(applications);
   }

   function formatDuration(duration: Duration) {
      return `${Math.floor(duration.asHours()).toString().padStart(2, "0")}:${duration.minutes().toString().padStart(2, "0")}:${duration.seconds().toString().padStart(2, "0")}`;
   }

   function onApplicationChanged(value: DropdownItem) {
      setSelectedApplication(value);
   }

   async function submit() {
      const application = openApplications.find((x) => x.processId === Number(selectedApplication?.value));

      if (!application) {
         return;
      }

      try {
         const result = await submitMutation.mutateAsync({
            exePath: application.exePath,
            windowTitle: application.displayName ?? application.windowTitle,
         });
         updateModals({
            info: {
               status: "success",
               title: "Success!",
               text: (
                  <div>
                     <p>Congratulations! The application got verified by Huginn under these names:</p>
                     <div className="mt-1 space-y-1">
                        {result?.names.map((x, i) => (
                           <div key={i} className="font-semibold">
                              {x}
                           </div>
                        ))}
                     </div>
                  </div>
               ),
               isOpen: true,
            },
         });
      } catch (e) {
         if (isWorthyHuginnError(e) && e.code === JsonCode.KNOWN_APPLICATION_EXISTS) {
            updateModals({ info: { status: "error", text: APIMessages[e.code], title: "Failed!", isOpen: true } });
         } else {
            updateModals({
               info: {
                  status: "info",
                  title: "Sorry!",
                  text: (
                     <div>
                        Huginn was not able to verify <span className="font-semibold">{application.displayName ?? application.windowTitle}</span> :(
                     </div>
                  ),
                  isOpen: true,
               },
            });
         }
      }
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
                           <div className="font-semibold">{formatDuration(moment.duration(moment(currentTime).diff(targetActivity.createdAt)))}</div>
                        </div>
                     </div>
                  </div>
               )}
            </div>
         </div>
         {huginnWindow.environment === "desktop" && (
            <div className="flex max-w-md flex-col">
               <div className="text-text/90 mb-2 select-none text-xs font-medium uppercase">Activity Submission</div>
               <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                  <div className="text-text/80 text-sm">
                     Not seeing what you're doing? Try adding it here. And if your application gets verified, We'll show your contribution!
                  </div>
                  <HuginnDropdown onChange={onApplicationChanged} value={selectedApplication}>
                     <HuginnDropdown.List className="bg-surface-deep w-full !rounded-md" placeholder="Select an application">
                        <HuginnDropdown.ItemsWrapper className="w-(--button-width)">
                           {applicationOptions.map((x) => (
                              <HuginnDropdown.Item key={x.id} item={x} />
                           ))}
                        </HuginnDropdown.ItemsWrapper>
                     </HuginnDropdown.List>
                  </HuginnDropdown>
                  <LoadingButton loading={submitMutation.isPending} onClick={submit} color="primary" className="h-8" disabled={!selectedApplication}>
                     Submit
                  </LoadingButton>
               </div>
            </div>
         )}
         <div className="flex max-w-sm flex-col">
            <div className="text-text/90 mb-2 select-none text-xs font-medium uppercase">Your Contributions</div>
            <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
               {contributedApplications.length === 0 ? (
                  <div className="text-text/80">No applications contributed...</div>
               ) : (
                  contributedApplications.map((x) => (
                     <div className="flex items-center gap-x-2" key={x.id}>
                        <div className="text-white">{x.names[0]}</div>
                        {x.names.length > 1 && (
                           <Tooltip>
                              <Tooltip.Trigger className="bg-surface rounded-md p-1">
                                 <IconMingcuteMore1Fill className="text-text size-5" />
                              </Tooltip.Trigger>
                              <Tooltip.Content>
                                 {x.names.slice(1).map((y) => (
                                    <div className="text-white">{y}</div>
                                 ))}
                              </Tooltip.Content>
                           </Tooltip>
                        )}
                        <div className="ml-auto text-white/70">{moment(x.createdAt).format("DD.MM.YYYY")}</div>
                     </div>
                  ))
               )}
            </div>
         </div>
      </div>
   );
}
