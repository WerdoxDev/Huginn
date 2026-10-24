import HuginnIconSelect from "@components/dropdown/HuginnIconSelect";
import HuginnSelect from "@components/dropdown/HuginnSelect";
import { ProfileActivity } from "@components/profile/ProfileComponents";
import Tooltip from "@components/tooltip/Tooltip";
import { useContributeApplication } from "@hooks/mutations/useContributeApplication";
import { HuginnLabel, HuginnLoadingButton, type HuginnSelectItem } from "@huginn/frontend-shared";
import { JsonCode } from "@huginnjs/shared";
import { getApplicationContributionsOptions } from "@lib/queries";
import { isWorthyHuginnError } from "@lib/utils";
import { useClient } from "@stores/clientStore";
import { useModals } from "@stores/modalsStore";
import { usePresenceStore } from "@stores/presenceStore";
import { useStorage } from "@stores/storageStore";
import { useThisUser } from "@stores/userStore";
import { useHuginnWindow } from "@stores/windowStore";
import { useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import moment from "moment";
import { useMemo, useState } from "react";

import type { SelectItem, SettingsTabProps } from "@/types";

import huginnInHuginnUrl from "@/assets/huginn-in-huginn-meme.jpg";

const contributionStatuses = {
   pending: { label: "Pending", className: "bg-surface-deep text-caution-300 " },
   accepted: { label: "Accepted", className: "bg-surface-deep text-positive-300 " },
   rejected: { label: "Rejected", className: "bg-surface-deep text-negative-300 " },
} as const;

type ContributionStatus = keyof typeof contributionStatuses;

const contributionStatusOrder: Record<ContributionStatus, number> = {
   accepted: 0,
   pending: 1,
   rejected: 2,
};

const contributionStatusOptions: HuginnSelectItem<ContributionStatus>[] = [
   { value: "accepted", text: contributionStatuses.accepted.label },
   { value: "pending", text: contributionStatuses.pending.label },
   { value: "rejected", text: contributionStatuses.rejected.label },
];

const contributionSortOptions: HuginnSelectItem<"asc" | "desc" | "status">[] = [
   { value: "status", text: "Status", icon: <IconMingcuteListCheck2Fill className="size-4 shrink-0" /> },
   { value: "desc", text: "Newest first", icon: <IconMingcuteSortDescendingFill className="size-4 shrink-0" /> },
   { value: "asc", text: "Oldest first", icon: <IconMingcuteSortAscendingFill className="size-4 shrink-0" /> },
];

export default function SettingsContributionTab(_props: SettingsTabProps) {
   const client = useClient();
   const knownApplications = useStorage("application-catalog");
   const [selectedApplication, setSelectedApplication] = useState<SelectItem>();
   const [sortOrder, setSortOrder] = useState<"asc" | "desc" | "status">("status");
   const [statusFilters, setStatusFilters] = useState<ContributionStatus[]>([]);
   const selectedSort = contributionSortOptions.find((option) => option.value === sortOrder) ?? contributionSortOptions[0];
   const hasStatusFilters = statusFilters.length > 0 && statusFilters.length < contributionStatusOptions.length;
   const submitMutation = useContributeApplication();
   const { user } = useThisUser();
   const { session } = usePresenceStore();
   const { updateModals } = useModals();
   const huginnWindow = useHuginnWindow();
   const targetActivity = session.activities[0];
   const accentColor = user?.accentColor ?? "transparent";

   const { data } = useQuery({
      queryKey: ["open-applications"],
      queryFn: async () => await window.electronAPI.getOpenApplications(),
      enabled: huginnWindow.environment === "desktop",
      refetchInterval: 1000,
   });
   const { data: contributions = [] } = useQuery(getApplicationContributionsOptions());

   const applicationOptions = useMemo(
      () =>
         data?.map((x) => ({
            id: Math.random(),
            value: x.processId.toString(),
            text: x.windowTitle,
            icon: x.icon ? (
               <img src={x.icon} className="aspect-square size-6 shrink-0" />
            ) : (
               <div className="size-6 shrink-0 rounded-sm bg-white/50" />
            ),
         })),
      [data],
   );

   const contributedApplications = useMemo(() => {
      const games = new Map(knownApplications.games.map((game) => [game.id, game]));
      return contributions
         .filter((contribution) => statusFilters.length === 0 || statusFilters.includes(contribution.status))
         .map((contribution) => ({
            contribution,
            game: contribution.knownGameId === null ? undefined : games.get(contribution.knownGameId),
         }))
         .sort((a, b) => {
            if (sortOrder === "status") {
               const statusDifference = contributionStatusOrder[a.contribution.status] - contributionStatusOrder[b.contribution.status];
               if (statusDifference !== 0) return statusDifference;
            }
            const difference = new Date(a.contribution.createdAt).getTime() - new Date(b.contribution.createdAt).getTime();
            return sortOrder === "asc" ? difference : -difference;
         });
   }, [contributions, knownApplications.games, sortOrder, statusFilters]);

   function onApplicationChanged(value: SelectItem) {
      setSelectedApplication(value);
   }

   async function submit() {
      const application = data?.find((x) => x.processId === Number(selectedApplication?.value));
      if (!application?.exePath) return;

      // Huginn easter egg.
      if (application.processId === huginnWindow.processId) {
         updateModals({ info: { isOpen: true, title: "WHAT?!", text: <img src={huginnInHuginnUrl} />, status: "info" } });
         return;
      }

      try {
         await submitMutation.mutateAsync({
            exePath: application.exePath
               .split(/[/\\]+/)
               .filter((component) => component && !/^[a-z]:$/i.test(component))
               .slice(-3)
               .join("/"),
            windowTitle: application.displayName || application.windowTitle,
            commandLine: application.cmdLine,
            platform: huginnWindow.platform,
            icon: application.icon ?? undefined,
         });
         updateModals({
            info: {
               status: "success",
               title: "Submitted!",
               text: "Your game contribution is now waiting for staff review.",
               isOpen: true,
            },
         });
      } catch (e) {
         console.log(e);
         if (isWorthyHuginnError(e) && e.code === JsonCode.DUPLICATE_CONTRIBUTION) {
            updateModals({
               info: {
                  status: "info",
                  title: "Already Submitted",
                  text: "This application has already been submitted.",
                  isOpen: true,
               },
            });
            return;
         }
         updateModals({
            info: {
               status: "error",
               title: "Submission failed",
               text: (
                  <div>
                     Huginn could not submit <span className="font-semibold">{application.displayName ?? application.windowTitle}</span>. Please try
                     again.
                  </div>
               ),
               isOpen: true,
            },
         });
      }
   }

   return (
      <div className="flex w-full flex-col items-center">
         <div className="flex w-full max-w-md flex-col gap-y-5">
            {huginnWindow.environment === "desktop" && (
               <div className="flex flex-col">
                  <HuginnLabel>Submit Application</HuginnLabel>
                  <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                     <div className="text-text/80 text-sm">
                        Not seeing what you're doing? Try adding it here. And if your application gets verified, we'll show your contribution!
                     </div>
                     <HuginnSelect onChange={onApplicationChanged} selected={selectedApplication}>
                        <HuginnSelect.List className="bg-surface-deep w-full! rounded-md!" placeholder="Select an application">
                           <HuginnSelect.ItemsWrapper>
                              {applicationOptions?.map((x) => (
                                 <HuginnSelect.Item key={x.value} item={x} />
                              ))}
                           </HuginnSelect.ItemsWrapper>
                        </HuginnSelect.List>
                     </HuginnSelect>
                     <HuginnLoadingButton
                        isLoading={submitMutation.isPending}
                        onClick={submit}
                        color="primary"
                        className="h-8"
                        disabled={!selectedApplication}
                     >
                        Submit
                     </HuginnLoadingButton>
                  </div>
               </div>
            )}
            <div className="flex flex-col">
               <HuginnLabel>Current Activity</HuginnLabel>
               {!targetActivity ? (
                  <div className="bg-surface-alt rounded-lg p-3">
                     <div className="text-text/80">No activities detected...</div>
                  </div>
               ) : (
                  <ProfileActivity activity={targetActivity} accentColor={accentColor} className="bg-surface-alt" />
               )}
            </div>
            <div className="flex flex-col">
               <div className="flex items-end justify-between gap-2">
                  <HuginnLabel>Your Contributions</HuginnLabel>
                  {/*<div className="text-text/90 text-xs font-medium uppercase select-none">Your Contributions</div>*/}
                  <div className="mb-1 flex items-center gap-1">
                     <HuginnIconSelect
                        label="Filter contributions by status"
                        icon={<IconMingcuteFilterFill className="size-4" />}
                        options={contributionStatusOptions}
                        multiple
                        value={statusFilters}
                        onChange={setStatusFilters}
                        active={hasStatusFilters}
                     />
                     <HuginnIconSelect
                        label="Sort contributions"
                        icon={selectedSort.icon}
                        options={contributionSortOptions}
                        value={sortOrder}
                        onChange={setSortOrder}
                     />
                  </div>
               </div>
               <div className="bg-surface-alt flex flex-col gap-y-2 rounded-lg p-3">
                  {contributedApplications.length === 0 ? (
                     <div className="text-text/80">
                        {contributions.length === 0 ? "No applications contributed..." : "No contributions match the selected statuses."}
                     </div>
                  ) : (
                     contributedApplications.map(({ contribution, game }) => {
                        const contributionStatus = contributionStatuses[contribution.status];
                        const knownGameIconHash = game?.iconHash ?? contribution.iconHash;
                        const iconUrl =
                           contribution.knownGameId !== null && knownGameIconHash
                              ? client?.cdn.applicationIcon(contribution.knownGameId, knownGameIconHash)
                              : contribution.iconHash
                                ? client?.cdn.applicationIcon(contribution.id, contribution.iconHash)
                                : undefined;
                        return (
                           <div className="flex items-center gap-x-2" key={contribution.id}>
                              {iconUrl ? (
                                 <img src={iconUrl} alt="" className="size-8 shrink-0 rounded-md" />
                              ) : (
                                 <div className="bg-primary-700 flex size-8 items-center justify-center rounded-md font-bold text-white">?</div>
                              )}
                              <div className="min-w-0 truncate text-white">{game?.canonicalName ?? contribution.windowTitle}</div>
                              {game && game.aliases.length > 0 && (
                                 <Tooltip>
                                    <Tooltip.Trigger className="bg-surface rounded-md p-1">
                                       <IconMingcuteMore1Fill className="text-text size-5" />
                                    </Tooltip.Trigger>
                                    <Tooltip.Content>
                                       {game.aliases.map((alias) => (
                                          <div className="text-white" key={alias}>
                                             {alias}
                                          </div>
                                       ))}
                                    </Tooltip.Content>
                                 </Tooltip>
                              )}
                              <div className={clsx("ml-auto rounded px-2 py-1 text-xs", contributionStatus.className)}>
                                 {contributionStatus.label}
                              </div>
                              <div className="text-text/70 w-20 text-right">{moment(contribution.createdAt).format("DD.MM.YYYY")}</div>
                           </div>
                        );
                     })
                  )}
               </div>
            </div>
         </div>
      </div>
   );
}
