import type { ReactNode } from "react";

import ApplicationContributionsProvider from "./ApplicationContributionsProvider";
import ChannelsProvider from "./ChannelsProvider";
import FriendsProvider from "./FriendsProvider";
import MessageWebsocketProvider from "./MessageWebsocketProvider";

export default function WebsocketProviders(props: { children?: ReactNode }) {
   return (
      <ApplicationContributionsProvider>
         <ChannelsProvider>
            <MessageWebsocketProvider>
               <FriendsProvider>{props.children}</FriendsProvider>
            </MessageWebsocketProvider>
         </ChannelsProvider>
      </ApplicationContributionsProvider>
   );
}
