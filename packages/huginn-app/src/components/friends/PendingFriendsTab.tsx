import type { Snowflake } from "@huginn/shared";

import { Tabs } from "@base-ui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { useCreateRelationship } from "@hooks/mutations/useCreateRelationship";
import { useRemoveRelationship } from "@hooks/mutations/useRemoveRelationship";
import { RelationshipType } from "@huginn/shared";
import { useMemo } from "react";

import type { AppRelationship, AppUser } from "@/types";

import FriendItem from "./FriendItem";

export default function PendingFriendsTab(props: { friends: AppRelationship[] }) {
   const createMutation = useCreateRelationship();
   const removeMutation = useRemoveRelationship();

   const userLookup = useUsers(props.friends?.map((x) => x.userId)).reduce<Record<Snowflake, AppUser>>((acc, user) => {
      acc[user.id] = user;
      return acc;
   }, {});

   const pendingFriends = useMemo(
      () => props.friends.filter((x) => x.type === RelationshipType.PENDING_INCOMING || x.type === RelationshipType.PENDING_OUTGOING),
      [props.friends],
   );

   const pendingAmount = useMemo(() => pendingFriends.length, [pendingFriends]);

   function denyOrCancelRelationship(userId: Snowflake) {
      removeMutation.mutate(userId);
   }

   function acceptRelationship(userId: Snowflake) {
      createMutation.mutate({ userId });
   }
   return (
      <Tabs.Panel value="pending">
         <div className="text-text/70 ml-2.5 text-xs font-medium uppercase">Pending - {pendingAmount}</div>
         <div className="mt-5 flex flex-col justify-center gap-y-1">
            {pendingFriends.map((friend) => (
               <FriendItem
                  key={friend.id}
                  type={friend.type}
                  user={userLookup[friend.userId]}
                  onDenyOrCancel={denyOrCancelRelationship}
                  onAccept={acceptRelationship}
               />
            ))}
         </div>
      </Tabs.Panel>
   );
}
