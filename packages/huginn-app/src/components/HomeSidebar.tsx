import { APIGetUserChannelsResult } from "@huginn/shared";
import DirectMessageChannel from "./DirectMessageChannel";
import RingLinkButton from "./button/RingLinkButton";
import { useWindow } from "@contexts/windowContext";
import clsx from "clsx";
import { Tooltip } from "./tooltip/Tooltip";

export default function HomeSidebar(props: { channels?: APIGetUserChannelsResult }) {
   const appWindow = useWindow();

   return (
      <nav className={clsx("bg-secondary h-full rounded-l-xl", appWindow.environment === "browser" && "rounded-tl-none")}>
         <div className="flex h-[4.75rem] items-center px-6">
            <div className="text-text text-xl font-bold">Home</div>
            <RingLinkButton to="/friends" className="ml-6 px-2 py-1 text-xs font-medium">
               Friends
            </RingLinkButton>
         </div>
         <div className="h-0.5 bg-white/10" />
         <div className="mx-3.5 mb-3.5 mt-6 flex items-center justify-between text-xs">
            <div className="text-text/70 hover:text-text/100 font-medium uppercase">Direct Messages</div>
            <Tooltip>
               <Tooltip.Trigger>
                  <IconMdiPlus className="text-text size-4" />
               </Tooltip.Trigger>
               <Tooltip.Content>Add a DM</Tooltip.Content>
            </Tooltip>
         </div>
         <ul className="flex flex-col px-2">
            {props.channels?.map(channel => <DirectMessageChannel key={channel.id} channel={channel} />)}
         </ul>
      </nav>
   );
}
