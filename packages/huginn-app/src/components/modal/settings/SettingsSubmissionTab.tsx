import type { ProcessInfo } from "native-addon";

import LoadingButton from "@components/button/LoadingButton";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import HuginnIcon from "@components/HuginnIcon";
import { ProfileActivity } from "@components/profile/ProfileComponents";
import Tooltip from "@components/tooltip/Tooltip";
import { useSubmitKnownApplication } from "@hooks/mutations/useSubmitKnownApplication";
import { JsonCode } from "@huginn/shared";
import { APIMessages } from "@lib/error-messages";
import { isWorthyHuginnError } from "@lib/utils";
import { useModals } from "@stores/modalsStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import moment from "moment";
import { useEffect, useMemo, useState } from "react";

import type { SelectItem, SettingsTabProps } from "@/types";

import huginnInHuginnUrl from "@/assets/huginn-in-huginn-meme.jpg";

type OpenApplication = ProcessInfo & { displayName?: string; icon?: string };

export default function SettingsSubmissionTab(_props: SettingsTabProps) {
   const [openApplications, setOpenApplications] = useState<OpenApplication[]>([]);
   const knownApplications = useStorage("known-applications");
   const [selectedApplication, setSelectedApplication] = useState<SelectItem>();
   const submitMutation = useSubmitKnownApplication();
   const { user } = useThisUser();
   const { thisPresence } = usePresenceStore();
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();
   const targetActivity = thisPresence.activities[0];
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

   const contributedApplications = useMemo(
      () => knownApplications.applications.filter((x) => x.contributorId === user?.id),
      [user, knownApplications],
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

   async function submit() {
      const application = openApplications.find((x) => x.processId === Number(selectedApplication?.value));

      if (!application) return;

      if (application.processId === huginnWindow.processId) {
         updateModals({ info: { isOpen: true, title: "WHAT?!", text: <img src={huginnInHuginnUrl} />, status: "info" } });
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
            updateModals({
               info: { status: "error", text: APIMessages[e.code], title: "Failed!", isOpen: true },
            });
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
                  <div className="text-text/90 mb-2 text-xs font-medium uppercase select-none">Submit Application</div>
                  <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                     <div className="text-text/80 text-sm">
                        Not seeing what you're doing? Try adding it here. And if your application gets verified, we'll show your contribution!
                     </div>
                     <HuginnSelect onChange={onApplicationChanged} selected={selectedApplication}>
                        <HuginnSelect.List className="bg-surface-deep w-full rounded-md!" placeholder="Select an application">
                           <HuginnSelect.ItemsWrapper className="w-(--button-width)">
                              {applicationOptions.map((x) => (
                                 <HuginnSelect.Item key={x.value} item={x} />
                              ))}
                           </HuginnSelect.ItemsWrapper>
                        </HuginnSelect.List>
                     </HuginnSelect>
                     <LoadingButton
                        isLoading={submitMutation.isPending}
                        onClick={submit}
                        color="primary"
                        className="h-8"
                        disabled={!selectedApplication}
                     >
                        Submit
                     </LoadingButton>
                  </div>
               </div>
            )}
            <div className="flex flex-col">
               <div className="text-text/90 mb-2 text-xs font-medium uppercase select-none">Your Contributions</div>
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
      </div>
   );
}
