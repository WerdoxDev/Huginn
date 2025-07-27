import AddFriendTab from "@components/friends/AddFriendTab";
import FriendsTab from "@components/friends/FriendsTab";
import FriendsTabItem from "@components/friends/FriendsTabItem";
import PendingFriendsTab from "@components/friends/PendingFriendsTab";
import { Tab, TabGroup, TabList, TabPanels } from "@headlessui/react";
import { RelationshipType } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { client, useClient } from "@stores/clientStore";
import { usePresences } from "@stores/presenceStore";
import { useSuspenseQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { usePostHog } from "posthog-js/react";
import { useMemo } from "react";
import { Fragment } from "react/jsx-runtime";
import { queryClient } from "@/main";

export async function clientLoader() {
   if (!client) {
      return;
   }

   return await queryClient.ensureQueryData(getRelationshipsOptions(client));
}

const tabs = ["Online", "All", "Pending"];

export default function Friends() {
   const client = useClient();
   const { data: friends } = useSuspenseQuery(getRelationshipsOptions(client));
   const posthog = usePostHog();

   const allFriends = useMemo(() => friends?.filter((x) => x.type === RelationshipType.FRIEND), [friends]);
   const { presences } = usePresences(allFriends?.map((x) => x.userId) ?? []);
   const onlineFriends = useMemo(
      () => friends?.filter((x) => x.type === RelationshipType.FRIEND && presences.some((y) => y.user.id === x.userId && y.status === "online")),
      [allFriends, presences],
   );

   function onTabChange(index: number) {
      posthog.capture(`friends:${tabs[index]?.toLowerCase() ?? "Add Friend"}_tab_view`);
   }

   return (
      <div className="flex h-full flex-col">
         <TabGroup as={Fragment} defaultIndex={friends.length === 0 ? 3 : 0} onChange={onTabChange}>
            <div className="h-19 bg-surface-deep flex shrink-0 items-center px-6">
               <TabList className="mr-5 flex justify-center gap-x-5">
                  <div className="text-text flex items-center justify-center gap-x-2.5">
                     <IconMingcuteGroup2Fill className="size-6" />
                     <span className="text-lg font-bold">Friends</span>
                  </div>

                  {tabs.map((tab) => (
                     <FriendsTabItem key={tab}>{tab}</FriendsTabItem>
                  ))}

                  <Tab as={Fragment}>
                     {({ selected }) => (
                        <button
                           type="button"
                           className={clsx(
                              "outline-hidden cursor-pointer rounded-md px-2",
                              selected
                                 ? "bg-primary-700 text-text pointer-events-none"
                                 : "text-text ring-primary-700 hover:bg-primary-700 hover:text-text ring-1 hover:ring-0",
                           )}
                        >
                           Add Friend
                        </button>
                     )}
                  </Tab>
               </TabList>
            </div>
            <div className="h-0.5 shrink-0 bg-white/10" />
            <TabPanels className="h-full overflow-y-scroll p-5">
               <FriendsTab friends={onlineFriends} presences={presences} text="Online" />
               <FriendsTab friends={allFriends} presences={presences} text="All Friends" />
               <PendingFriendsTab friends={friends} />
               <AddFriendTab />
            </TabPanels>
         </TabGroup>
         <div className="bg-surface flex h-16 w-full shrink-0" />
      </div>
   );
}
