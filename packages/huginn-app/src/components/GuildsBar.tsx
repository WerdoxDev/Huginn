export default function GuildsBar() {
	const { lastReadMessages } = useReadStates();

	return (
		<nav className="flex h-full w-[4.75rem] shrink-0 flex-col bg-background p-3.5">
			<HomeButton />
			<div className="flex flex-col items-center justify-center">
				{lastReadMessages
					.filter((x) => x.unreadCount > 0)
					.map((x) => (
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
