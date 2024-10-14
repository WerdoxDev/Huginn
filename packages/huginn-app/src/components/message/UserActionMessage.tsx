import type { MessageRendererProps } from "@/types";
import { MessageType } from "@huginn/shared";
import { useMemo } from "react";

export default function UserActionMessage(props: MessageRendererProps) {
	const name = useMemo(() => props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username, [props.renderInfo]);
	const mentionName = useMemo(
		() => props.renderInfo.message.mentions[0].displayName ?? props.renderInfo.message.mentions[0].username,
		[props.renderInfo],
	);

	const type = useMemo(() => props.renderInfo.message.type, [props.renderInfo]);
	return (
		<>
			<div className="flex items-center text-text">
				{type === MessageType.RECIPIENT_REMOVE && <IconMingcuteArrowLeftLine className="mr-5 size-5 text-error" />}
				{type === MessageType.RECIPIENT_ADD && <IconMingcuteArrowRightLine className="mr-5 size-5 text-success" />}
				<div>
					<span className="font-bold">{name}</span>
					{type === MessageType.RECIPIENT_ADD && <span className="text-text/50"> added </span>}
					{type === MessageType.RECIPIENT_REMOVE && <span className="text-text/50"> removed </span>}
					<span className="font-bold">{mentionName}</span>
				</div>
			</div>
		</>
	);
}
