import { TabPanel } from "@headlessui/react";
import { APIRelationshipWithoutOwner, RelationshipType } from "@shared/api-types";
import { Snowflake } from "@shared/snowflake";
import { useMemo } from "react";
import FriendItem from "./FriendItem";
import { useClient } from "@contexts/apiContext";

export default function PendingFriendsTab(props: { friends: APIRelationshipWithoutOwner[] }) {
   const client = useClient();

   const pendingFriends = useMemo(
      () => props.friends.filter((x) => x.type === RelationshipType.PENDING_INCOMING || x.type === RelationshipType.PENDING_OUTGOING),
      [props.friends],
   );

   const pendingAmount = useMemo(() => pendingFriends.length, [pendingFriends]);

   async function denyOrCancelRelationship(userId: Snowflake) {
      await client.users.deleteRelationship(userId);
   }

   async function acceptRelationship(userId: Snowflake) {
      await client.users.createRelationshipByUserId(userId);
   }
   return (
      <TabPanel>
         <div className="ml-2.5 text-xs font-medium uppercase text-text/70">Pending - {pendingAmount}</div>
         <div className="mt-5 flex flex-col justify-center gap-y-1">
            {pendingFriends.map((friend) => (
               <FriendItem
                  key={friend.id}
                  type={friend.type}
                  user={friend.user}
                  onDenyOrCancel={denyOrCancelRelationship}
                  onAccept={acceptRelationship}
               />
            ))}
         </div>
      </TabPanel>
   );
}
