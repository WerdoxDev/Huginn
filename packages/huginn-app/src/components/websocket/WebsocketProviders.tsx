import type { ReactNode } from "react";
import ChannelsProvider from "./ChannelsProvider";
import FriendsProvider from "./FriendsProvider";
import MessageProvider from "./MessageProvider";

export default function WebsocketProviders(props: { children?: ReactNode }) {
	return (
		<ChannelsProvider>
			<MessageProvider>
				<FriendsProvider>{props.children}</FriendsProvider>
			</MessageProvider>
		</ChannelsProvider>
	);
}
