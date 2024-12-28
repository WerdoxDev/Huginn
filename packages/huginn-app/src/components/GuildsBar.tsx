import { Transition } from "@headlessui/react";
import { snowflake } from "@huginn/shared";
import { useQuery } from "@tanstack/react-query";
import moment from "moment";
import { AnimatePresence, LayoutGroup, type Variants, motion } from "motion/react";

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

	const variants: Variants = {
		visible: (i) => ({
			scale: 1,
			opacity: 1,
			transition: { type: "spring", bounce: 0.4, delay: i * 0.1 },
		}),
		hidden: { scale: 0, opacity: 0 },
		exit: { scale: 0, opacity: 0 },
	};

	return (
		<nav className="flex h-full w-[4.75rem] shrink-0 flex-col bg-background p-3.5">
			<HomeButton />
			<div className="flex flex-col items-center justify-center">
				<AnimatePresence mode="popLayout">
					{sortedReadStates.map((x, i) => (
						<motion.div layout custom={i} variants={variants} key={x.channelId} initial="hidden" animate="visible" exit="exit">
							<UnreadChannel channelId={x.channelId} unreadCount={x.unreadCount} />
						</motion.div>
					))}
				</AnimatePresence>
			</div>
			<motion.div layout className="mx-4 my-3.5 h-0.5 bg-white/20" />
			<motion.div layout className="flex flex-col items-center gap-3">
				<GuildButton />
				<GuildButton />
				<GuildButton />
			</motion.div>
		</nav>
	);
}
