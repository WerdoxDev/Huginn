import { APIGetUserChannelsResult } from "@shared/api-types";
import DirectMessageChannel from "./DirectMessageChannel";
import RingLinkButton from "./button/RingLinkButton";
import { useLogout } from "@hooks/useLogout";

export default function HomeSidebar(props: { channels?: APIGetUserChannelsResult }) {
   const logout = useLogout();
   return (
      <nav className="h-full rounded-l-xl bg-secondary">
         <div className="flex h-[4.75rem] items-center px-6">
            <button onClick={() => logout(true)}>HI</button>
            <div className="text-xl font-bold text-text">Home</div>
            <RingLinkButton to="/friends" className="ml-6 px-2 py-1 text-xs font-medium">
               Friends
            </RingLinkButton>
         </div>
         <div className="h-0.5 bg-white/10" />
         <div className="mx-3.5 mb-3.5 mt-6 text-xs font-medium uppercase text-text/70 hover:text-text/100">Direct Messages</div>
         <ul className="flex flex-col px-2">
            {props.channels?.map((channel) => <DirectMessageChannel key={channel.id} channel={channel} />)}
         </ul>
      </nav>
   );
}
