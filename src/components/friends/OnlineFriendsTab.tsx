import { TabPanel } from "@headlessui/react";
import FriendItem from "./FriendItem";
import { APIRelationshipWithoutOwner, RelationshipType } from "@shared/api-types";
import { useMemo } from "react";
import { Snowflake } from "@shared/snowflake";
import { useClient } from "@contexts/apiContext";
import { useMutation } from "@tanstack/react-query";

export default function OnlineFriendsTab(props: { friends: APIRelationshipWithoutOwner[] | null }) {
   const client = useClient();
   const onlineFriends = useMemo(() => props.friends?.filter((x) => x.type === RelationshipType.FRIEND), [props.friends]);
   const onlineAmount = useMemo(() => onlineFriends?.length, [onlineFriends]);

   const mutation = useMutation({
      async mutationFn(userId: Snowflake) {
         await client.channels.createDm({ recipientId: userId });
      },
   });

   function createChannel(userId: Snowflake) {
      mutation.mutate(userId);
   }

   return (
      <TabPanel>
         <div className="ml-2.5 text-xs font-medium uppercase text-text/70">Online - {onlineAmount}</div>
         <div className="mt-5 flex flex-col justify-center gap-y-1">
            {onlineFriends?.map((friend) => (
               <FriendItem onMessage={createChannel} key={friend.id} user={friend.user} type={friend.type} />
            ))}
         </div>
      </TabPanel>
   );
}
