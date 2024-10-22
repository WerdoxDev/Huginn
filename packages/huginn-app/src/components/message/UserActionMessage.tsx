import type { MessageRendererProps } from "@/types";
import { MessageType } from "@huginn/shared";
import clsx from "clsx";

export default function UserActionMessage(props: MessageRendererProps) {
	const author = useMemo(() => props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username, [props.renderInfo]);
	const mention = useMemo(
		() => props.renderInfo.message.mentions[0]?.displayName ?? props.renderInfo.message.mentions[0]?.username,
		[props.renderInfo],
	);

	const isLastExotic = useMemo(() => props.lastRenderInfo?.exoticType || !props.lastRenderInfo, [props.lastRenderInfo]);
	const isNextExotic = useMemo(() => props.nextRenderInfo?.exoticType || !props.nextRenderInfo, [props.nextRenderInfo]);

	const type = useMemo(() => props.renderInfo.message.type, [props.renderInfo]);
	return (
		<div
			className={clsx(
				"flex items-center rounded-r-md py-0.5 pl-4 text-text hover:bg-secondary",
				!isLastExotic && !props.renderInfo.newDate && "mt-1.5",
				!isNextExotic && "mb-1.5",
			)}
		>
			{type === MessageType.RECIPIENT_REMOVE && <IconMingcuteArrowLeftFill className="mr-4 size-5 text-error" />}
			{type === MessageType.RECIPIENT_ADD && <IconMingcuteArrowRightFill className="mr-4 size-5 text-success" />}
			{type === MessageType.CHANNEL_NAME_CHANGED && <IconMingcuteEdit2Fill className="mr-4 size-5 text-text/80" />}
			{type === MessageType.CHANNEL_ICON_CHANGED && <IconMingcutePic2Fill className="mr-4 size-5 text-text/80" />}
			<div>
				<span className="font-bold">{author}</span>
				{type === MessageType.CHANNEL_ICON_CHANGED && <span className="text-text"> changed the channel icon</span>}
				{type === MessageType.CHANNEL_NAME_CHANGED &&
					(!props.renderInfo.message.content ? (
						<span className="text-text"> removed the channel name</span>
					) : (
						<>
							<span className="text-text"> changed the chanel name: </span>
							<span className="font-bold text-text">{props.renderInfo.message.content}</span>
						</>
					))}
				{mention ? (
					<>
						{type === MessageType.RECIPIENT_ADD && <span className="text-text/50"> added </span>}
						{type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> removed </span>}
						<span className="font-bold">{mention}</span>
					</>
				) : (
					type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> left the group</span>
				)}
			</div>
		</div>
	);
}
