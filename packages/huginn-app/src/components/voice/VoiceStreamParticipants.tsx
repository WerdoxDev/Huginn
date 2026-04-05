import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { useUsers } from "@hooks/api-hooks/userHooks";

import type { MediaSource } from "@/types";

export function VoiceStreamParticipants(props: { mediaSource?: MediaSource }) {
   const users = useUsers(props.mediaSource?.consumerUserIds);

   if (!props.mediaSource?.consumerUserIds?.length) {
      return;
   }

   return (
      <div className="bg-surface-deep absolute top-2 left-2 z-10 flex gap-x-0.5 rounded-lg px-1 py-1 italic opacity-0 transition-opacity group-hover/element:opacity-100">
         {users.map((x) => (
            <Tooltip key={x.id}>
               <Tooltip.Trigger>
                  <UserAvatar userId={x.id} avatarHash={x.avatar} hideStatus size={1} />
               </Tooltip.Trigger>
               <Tooltip.Content>{x.displayName}</Tooltip.Content>
            </Tooltip>
         ))}
      </div>
   );
}
