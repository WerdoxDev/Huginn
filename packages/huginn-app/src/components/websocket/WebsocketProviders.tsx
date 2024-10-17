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
