import ChannelsProvider from "@components/websocket/ChannelsProvider.tsx";
import FriendsProvider from "@components/websocket/FriendsProvider.tsx";
import MessageProvider from "@components/websocket/MessageProvider.tsx";
import type { ReactNode } from "react";

export default function WebsocketProviders(props: { children?: ReactNode }) {
	return (
		<ChannelsProvider>
			<MessageProvider>
				<FriendsProvider>{props.children}</FriendsProvider>
			</MessageProvider>
		</ChannelsProvider>
	);
}
