import UserIconWithStatus from "@components/UserIconWithStatus";
import { useChannelName } from "@hooks/useChannelName";
import { APIDMChannel, APIGroupDMChannel, ChannelType } from "@huginn/shared";

export default function HomeTopbar(props: { channel: APIDMChannel | APIGroupDMChannel }) {
   const name = useChannelName(props.channel);

   return (
      <div className="bg-tertiary flex h-[4.75rem] flex-shrink-0 items-center px-6">
         <div className="flex items-center">
            {props.channel.type === ChannelType.DM ? (
               <UserIconWithStatus className="bg-background mr-3" />
            ) : (
               <div className="bg-background mr-3 size-[2.25rem] rounded-full"></div>
            )}
            <div className="text-text">{name}</div>
         </div>
      </div>
   );
}
