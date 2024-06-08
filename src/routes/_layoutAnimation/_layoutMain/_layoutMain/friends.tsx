import { Tab, TabGroup, TabList } from "@headlessui/react";
import { createFileRoute } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";
import FriendsTabItem from "../../../../components/friends/FriendsTabItem";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain/_layoutMain/friends")({
   component: Friends,
});

const tabs = ["Online", "All", "Pending"];

function Friends() {
   return (
      <div className="flex h-full flex-col">
         <TabGroup>
            <div className="flex h-[4.75rem] flex-shrink-0 items-center bg-tertiary px-6">
               <TabList className="mr-5 flex justify-center gap-x-5">
                  <div className="flex items-center justify-center gap-x-2.5 text-text">
                     {/* <Icon name="fa-solid:user-friends" size="32" /> */}
                     <span className="text-lg font-bold">Friends</span>
                  </div>

                  {tabs.map((tab) => (
                     <FriendsTabItem key={tab}>{tab}</FriendsTabItem>
                  ))}

                  <Tab as={Fragment}>
                     {({ selected }) => (
                        <button
                           className={`rounded-md px-2 ${
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
            <div className="h-full p-5">
               {/* <OnlineFriendsTab :friends="friends" />
            <TabPanel />
            <PendingFriendsTab :friends="friends" />
            <AddFriendTab /> */}
            </div>
         </TabGroup>
         <div className="flex h-16 w-full flex-shrink-0 bg-background">
            <div className="h-full w-64 flex-shrink-0" />
         </div>
      </div>
   );
}
