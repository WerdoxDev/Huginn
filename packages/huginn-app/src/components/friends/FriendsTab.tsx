import type { Snowflake } from "@huginn/shared";

import { Tabs } from "@base-ui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useLookup } from "@hooks/useLookup";
import { useMemo } from "react";

import type { AppPresence, AppRelationship } from "@/types";

import FriendItem from "./FriendItem";

export default function FriendsTab(props: { friends: AppRelationship[] | null; presences: AppPresence[]; text: string; tabValue: string }) {
   const mutation = useCreateDMChannel("create-dm-channel_other");

   const users = useUsers(props.friends?.map((x) => x.userId));
   const userLookup = useLookup(users, (user) => user.id);
   const presenceLookup = useLookup(props.presences, (presence) => presence.userId);

   const amount = useMemo(() => props.friends?.length ?? 0, [props.friends]);

   function onMessage(userId: Snowflake) {
      if (!mutation.isPending) {
         mutation.mutate({ recipients: [userId] });
      }
   }

   return (
      <Tabs.Panel value={props.tabValue}>
         <div className="text-text/70 ml-2.5 text-xs font-medium uppercase">
            {props.text} - {amount}
         </div>
         <div className="mt-5 flex flex-col justify-center gap-y-1">
            {props.friends?.map((friend) => (
               <FriendItem
                  onMessage={onMessage}
                  presence={presenceLookup[friend.userId]}
                  user={userLookup[friend.userId]}
                  key={friend.id}
                  type={friend.type}
               />
            ))}
         </div>
      </Tabs.Panel>
   );
}
