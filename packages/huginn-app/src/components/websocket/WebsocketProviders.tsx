import type { ReactNode } from "react";
import FriendsProvider from "./FriendsProvider";
import MessageProvider from "./MessageProvider";
import ChannelsProvider from "./ChannelsProvider";

export default function WebsocketProviders(props: { children?: ReactNode }) {
	return (
		<ChannelsProvider>
			<MessageProvider>
				<FriendsProvider>{props.children}</FriendsProvider>
			</MessageProvider>
		</ChannelsProvider>
	);
}
