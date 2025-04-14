import type { MessageRendererProps } from "@/types";
import { useUser } from "@hooks/api-hooks/userHooks";
import { MessageType } from "@huginn/shared";
import clsx from "clsx";
import { useMemo } from "react";

export default function ActionMessage(props: MessageRendererProps) {
	const author = useUser(props.renderInfo.message.authorId);
	const authorName = useMemo(() => author?.displayName ?? author?.username, [props.renderInfo]);
	const mention = useMemo(
		() =>
			!props.renderInfo.message.preview &&
			(props.renderInfo.message.mentions?.[0]?.displayName ?? props.renderInfo.message.mentions?.[0]?.username),
		[props.renderInfo],
	);

	const isLastExotic = useMemo(() => props.lastRenderInfo?.exoticType || !props.lastRenderInfo, [props.lastRenderInfo]);
	const isNextExotic = useMemo(() => props.nextRenderInfo?.exoticType || !props.nextRenderInfo, [props.nextRenderInfo]);
	const isUnread = useMemo(() => props.renderInfo.unread, [props.renderInfo]);

	const type = useMemo(() => !props.renderInfo.message.preview && props.renderInfo.message.type, [props.renderInfo]);
	return (
		<div
			className={clsx(
				"flex items-center rounded-r-md py-0.5 pl-4 text-text hover:bg-secondary",
				!isLastExotic && !props.renderInfo.newDate && !isUnread && "mt-1.5",
				!isNextExotic && !isUnread && "mb-1.5",
			)}
		>
			{type === MessageType.RECIPIENT_REMOVE && <IconMingcuteArrowLeftFill className="mr-4 size-5 text-error" />}
			{type === MessageType.RECIPIENT_ADD && <IconMingcuteArrowRightFill className="mr-4 size-5 text-success" />}
			{type === MessageType.CHANNEL_NAME_CHANGED && <IconMingcuteEdit2Fill className="mr-4 size-5 text-text/80" />}
			{type === MessageType.CHANNEL_ICON_CHANGED && <IconMingcutePic2Fill className="mr-4 size-5 text-text/80" />}
			{type === MessageType.CHANNEL_OWNER_CHANGED && <IconMingcuteTransfer3Fill className="mr-4 size-5 text-accent" />}
			{type === MessageType.CALL && <IconMingcutePhoneFill className="mr-4 size-5 text-success" />}
			<div>
				<span className="font-bold">{authorName}</span>
				{type === MessageType.CALL && <span> started a call</span>}
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
						{type === MessageType.CHANNEL_OWNER_CHANGED && <span className="text-text/50"> promoted </span>}
						<span className="font-bold">{mention}</span>
						{type === MessageType.CHANNEL_OWNER_CHANGED && (
							<span className="text-text/50">
								{" "}
								to <span className="text-accent">Channel Owner</span>
							</span>
						)}
					</>
				) : (
					type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> left the group</span>
				)}
			</div>
		</div>
	);
}
