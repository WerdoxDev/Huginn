import { Tabs } from "@base-ui/react";
import MobileMenuButton from "@components/button/MobileMenuButton";
import AddFriendTab from "@components/friends/AddFriendTab";
import FriendsTab from "@components/friends/FriendsTab";
import FriendsTabItem from "@components/friends/FriendsTabItem";
import PendingFriendsTab from "@components/friends/PendingFriendsTab";
import TopBar from "@components/TopBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions, queryClient } from "@lib/queries";
import { clientStore, useClient } from "@stores/clientStore";
import { usePresences } from "@stores/presenceStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useMemo } from "react";

const tabs = [
   { value: "online", label: "Online" },
   { value: "all", label: "All" },
   { value: "pending", label: "Pending" },
];

export const Route = createFileRoute("/_app/_main/_home/friends")({
   component: FriendsComponent,
   loader: async () => {
      const client = clientStore.getState().client;
      if (!client) return;

      return await queryClient.ensureQueryData(getRelationshipsOptions(client));
   },
});

function FriendsComponent() {
   const client = useClient();
   const { data: friends } = useSuspenseQuery(getRelationshipsOptions(client!));
   const posthog = usePostHog();
   const isMobile = useIsMobile();

   const allFriends = useMemo(() => friends?.filter((x) => x.type === RelationshipType.FRIEND), [friends]);
   const { presences } = usePresences(allFriends?.map((x) => x.userId) ?? []);
   const onlineFriends = useMemo(
      () => friends?.filter((x) => x.type === RelationshipType.FRIEND && presences.some((y) => y.userId === x.userId && y.status === "online")),
      [allFriends, presences],
   );

   function onTabChange(index: number) {
      posthog.capture(`friends:${tabs[index]?.value ?? "Add Friend"}_tab_view`);
   }

   return (
      <Tabs.Root className="flex h-full flex-col" defaultValue={friends.length === 0 ? "add" : "online"} onValueChange={onTabChange}>
         <TopBar>
            {isMobile && <MobileMenuButton />}
            <Tabs.List className="mr-5 flex justify-center gap-x-5">
               <div className="text-text flex items-center justify-center gap-x-2.5">
                  <IconMingcuteGroup2Fill className="size-6" />
                  <span className="text-lg font-bold">Friends</span>
               </div>

               {tabs.map((tab) => (
                  <FriendsTabItem key={tab.value} tabValue={tab.value}>
                     {tab.label}
                  </FriendsTabItem>
               ))}

               <Tabs.Tab
                  type="button"
                  value="add-friend"
                  className={({ active }) =>
                     clsx(
                        "cursor-pointer rounded-md px-2 outline-hidden",
                        active
                           ? "bg-primary-700 text-text pointer-events-none"
                           : "text-text ring-primary-700 hover:bg-primary-700 hover:text-text ring-1 hover:ring-0",
                     )
                  }
               >
                  Add Friend
               </Tabs.Tab>
            </Tabs.List>
         </TopBar>
         <div className="h-full overflow-y-scroll p-5 pr-2">
            <FriendsTab friends={onlineFriends} presences={presences} text="Online" tabValue="online" />
            <FriendsTab friends={allFriends} presences={presences} text="All Friends" tabValue="all" />
            <PendingFriendsTab friends={friends} />
            <AddFriendTab />
         </div>
         <div className="bg-surface flex h-16 w-full shrink-0" />
      </Tabs.Root>
   );
}
