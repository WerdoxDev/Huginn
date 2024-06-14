import { ReactNode } from "react";
import FriendsProvider from "./FriendsProvider";
import MessageProvider from "./MessageProvider";

export default function WebsocketProviders(props: { children?: ReactNode }) {
   return (
      <MessageProvider>
         <FriendsProvider>{props.children}</FriendsProvider>
      </MessageProvider>
   );
}
