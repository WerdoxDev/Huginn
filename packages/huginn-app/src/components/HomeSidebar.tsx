import { APIGetUserChannelsResult } from "@huginn/shared";
import DirectMessageChannel from "./DirectMessageChannel";
import RingLinkButton from "./button/RingLinkButton";

export default function HomeSidebar(props: { channels?: APIGetUserChannelsResult }) {
   return (
      <nav className="bg-secondary h-full rounded-l-xl">
         <div className="flex h-[4.75rem] items-center px-6">
            <div className="text-text text-xl font-bold">Home</div>
            <RingLinkButton to="/friends" className="ml-6 px-2 py-1 text-xs font-medium">
               Friends
            </RingLinkButton>
         </div>
         <div className="h-0.5 bg-white/10" />
         <div className="text-text/70 hover:text-text/100 mx-3.5 mb-3.5 mt-6 text-xs font-medium uppercase">Direct Messages</div>
         <ul className="flex flex-col px-2">
            {props.channels?.map(channel => <DirectMessageChannel key={channel.id} channel={channel} />)}
         </ul>
      </nav>
   );
}
