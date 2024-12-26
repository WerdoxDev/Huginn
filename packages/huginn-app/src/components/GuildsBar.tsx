import { snowflake } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";

export default function GuildsBar() {
	const client = useClient();
	const { readStates } = useReadStates();
	const { data: channels } = useQuery(getChannelsOptions(client, "@me"));

	const sortedReadStates = useMemo(
		() =>
			readStates
				.filter((x) => x.unreadCount > 0)
				.toSorted((a, b) => {
					const aChannel = channels?.find((x) => x.id === a.channelId);
					const bChannel = channels?.find((x) => x.id === b.channelId);

					if (aChannel?.lastMessageId && bChannel?.lastMessageId) {
						return moment(snowflake.getTimestamp(aChannel.lastMessageId)).isBefore(snowflake.getTimestamp(bChannel.lastMessageId)) ? 1 : -1;
					}

					return 0;
				}),
		[readStates],
	);

	return (
		<nav className="flex h-full w-[4.75rem] shrink-0 flex-col bg-background p-3.5">
			<HomeButton />
			<div className="flex flex-col items-center justify-center">
				{sortedReadStates.map((x) => (
					<UnreadChannel key={x.channelId} channelId={x.channelId} unreadCount={x.unreadCount} />
				))}
			</div>
			<div className="mx-4 my-3.5 h-0.5 bg-white/20" />
			<div className="flex flex-col items-center gap-3">
				<GuildButton />
				<GuildButton />
				<GuildButton />
			</div>
		</nav>
	);
}
