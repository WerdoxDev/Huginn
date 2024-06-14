import ModalErrorComponent from "@components/ModalErrorComponent";
import AddFriendTab from "@components/friends/AddFriendTab";
import FriendsTabItem from "@components/friends/FriendsTabItem";
import OnlineFriendsTab from "@components/friends/OnlineFriendsTab";
import PendingFriendsTab from "@components/friends/PendingFriendsTab";
import { useClient } from "@contexts/apiContext";
import { Tab, TabGroup, TabList, TabPanel, TabPanels } from "@headlessui/react";
import { requireAuth } from "@lib/middlewares";
import { getRelationshipsOptions } from "@lib/queries";
import { useSuspenseQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutHome/friends")({
   beforeLoad({ context: { client } }) {
      requireAuth(client);
   },
   component: Friends,
   loader({ context: { queryClient, client } }) {
      return queryClient.ensureQueryData(getRelationshipsOptions(client));
   },
   errorComponent: ModalErrorComponent,
});

const tabs = ["Online", "All", "Pending"];

function Friends() {
   const client = useClient();
   const { data: friends } = useSuspenseQuery(getRelationshipsOptions(client));

   return (
      <div className="flex h-full flex-col">
         <TabGroup as={Fragment} defaultIndex={friends.length === 0 ? 3 : 0}>
            <div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
               <TabList className="mr-5 flex justify-center gap-x-5">
                  <div className="flex items-center justify-center gap-x-2.5 text-text">
                     <IconFaSolidUserFriends className="size-6" />
                     <span className="text-lg font-bold">Friends</span>
                  </div>

                  {tabs.map((tab) => (
                     <FriendsTabItem key={tab}>{tab}</FriendsTabItem>
                  ))}

                  <Tab as={Fragment}>
                     {({ selected }) => (
                        <button
                           className={`rounded-md px-2 outline-none ${
                              selected
                                 ? "pointer-events-none bg-primary text-text"
                                 : "text-text ring-1 ring-primary hover:bg-primary hover:text-text hover:ring-0"
                           }`}
                        >
                           Add Friend
                        </button>
                     )}
                  </Tab>
               </TabList>
            </div>
            <div className="h-0.5 flex-shrink-0 bg-white/10" />
            <TabPanels className="h-full p-5">
               <OnlineFriendsTab friends={friends} />
               <TabPanel />
               <PendingFriendsTab friends={friends} />
               <AddFriendTab />
            </TabPanels>
         </TabGroup>
         <div className="flex h-16 w-full flex-shrink-0 bg-background" />
      </div>
   );
}
