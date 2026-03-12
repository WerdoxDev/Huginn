import type { ReactNode } from "react";

import ChannelsProvider from "./ChannelsProvider";
import FriendsProvider from "./FriendsProvider";
import MessageWebsocketProvider from "./MessageWebsocketProvider";

export default function WebsocketProviders(props: { children?: ReactNode }) {
   return (
      <ChannelsProvider>
         <MessageWebsocketProvider>
            <FriendsProvider>{props.children}</FriendsProvider>
         </MessageWebsocketProvider>
      </ChannelsProvider>
   );
}
