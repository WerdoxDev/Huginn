import GameContributionsPanel from "@components/staff/GameContributionsPanel";
import { HuginnTab } from "@huginn/frontend-shared";
import { createFileRoute } from "@tanstack/react-router";

import KnownGamesPanel from "@/components/staff/KnownGamesPanel";

export const Route = createFileRoute("/staff/_staff/game-contributions")({
   component: StaffGamesComponent,
});

function StaffGamesComponent() {
   return (
      <HuginnTab defaultTab="submissions" className="flex h-full min-h-0 flex-col">
         <div className="border-surface bg-surface-deep shrink-0 border-b-2 px-2 py-2">
            <HuginnTab.TabList className="w-fit" tabClassName="h-9 px-4 text-sm font-medium">
               <HuginnTab.Tab value="submissions">Submissions</HuginnTab.Tab>
               <HuginnTab.Tab value="known-games">Known games</HuginnTab.Tab>
            </HuginnTab.TabList>
         </div>
         <HuginnTab.TabPanels className="min-h-0 flex-1" panelClassName="h-full min-h-0">
            <HuginnTab.TabPanel value="submissions">
               <GameContributionsPanel />
            </HuginnTab.TabPanel>
            <HuginnTab.TabPanel value="known-games">
               <KnownGamesPanel />
            </HuginnTab.TabPanel>
         </HuginnTab.TabPanels>
      </HuginnTab>
   );
}
