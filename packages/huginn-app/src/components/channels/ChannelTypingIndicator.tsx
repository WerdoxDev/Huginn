import { Transition } from "@headlessui/react";
import type { Snowflake } from "@huginn/shared";

export default function ChannelTypingIndicator(props: { channelId: Snowflake }) {
	const { typings } = useTypings();
	const { recipients } = useChannelRecipients(props.channelId, undefined);

	const lastValue = useRef<{ count: number; recipientsText: string; channelId: Snowflake }>();

	const channelTypings = useMemo(
		() => typings.filter((x) => x.channelId === props.channelId).map((x) => recipients?.find((y) => y.id === x.userId)),
		[typings, props.channelId],
	);

	const { count, recipientsText, channelId } = useMemo(() => {
		if (typings.length === 0 && lastValue.current) {
			return lastValue.current;
		}

		const recipientsText = channelTypings.map((x) => x?.displayName ?? x?.username).join(", ");

		lastValue.current = { count: channelTypings.length, recipientsText, channelId: props.channelId };
		return lastValue.current;
	}, [typings]);

	return (
		<Transition show={channelTypings.length > 0 && channelId === props.channelId}>
			<div className="pointer-events-none absolute right-5 bottom-0 left-0 z-10 flex h-8 items-end bg-gradient-to-t from-50% from-tertiary to-transparent pb-1 pl-4 text-sm transition-opacity data-[closed]:opacity-0 ">
				<span className="font-bold text-text">{recipientsText}&nbsp;</span>
				{count === 1 && <span className="text-text/70">is typing</span>}
				{count > 1 && <span className="text-text/70">are typing</span>}
				<LoadingDot loadingClassName="w-1 h-1" className="mb-1.5 ml-1 gap-x-0.5" />
			</div>
		</Transition>
	);
}
