import type { MessageRendererProps } from "@/types";
import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { useUser } from "@contexts/userContext";
import { MessageFlags, hasFlag } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import { useMemo } from "react";
import type { BaseEditor, Descendant, NodeEntry, Range } from "slate";
import { Editable, type ReactEditor, type RenderElementProps, type RenderLeafProps, Slate } from "slate-react";

export default function DefaultMessage(
	props: MessageRendererProps & {
		nextNew: boolean;
		currentNew: boolean;
		editor: BaseEditor & ReactEditor;
		decorate(entry: NodeEntry): Range[];
		renderLeaf(props: RenderLeafProps): React.JSX.Element;
		renderElement(props: RenderElementProps): React.JSX.Element;
	},
) {
	const { user } = useUser();

	const formattedTime = useMemo(() => moment(props.renderInfo.message.createdAt).format("DD.MM.YYYY HH:mm"), [props.renderInfo.message.createdAt]);
	const isSelf = useMemo(() => props.renderInfo.message.author.id === user?.id, [props.renderInfo.message.author]);

	const initialValue = useMemo(() => deserialize(props.renderInfo.message.content ?? ""), []);

	function deserialize(content: string): Descendant[] {
		return content.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
	}

	return (
		<div className={clsx("flex flex-col items-start gap-y-2 ", !isSelf && "ml-2")}>
			{props.currentNew && (
				<div className="flex items-center gap-x-2 overflow-hidden">
					<UserAvatarWithStatus
						userId={props.renderInfo.message.author.id}
						avatarHash={props.renderInfo.message.author.avatar}
						statusSize="0.5rem"
						size="1.75rem"
					/>
					<div className="text-sm text-text">
						{isSelf ? "You" : (props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username)}
					</div>
					{props.renderInfo.message.flags && hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMdiNotificationsOff className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="overflow-hidden font-light text-white">
				<Slate editor={props.editor} initialValue={initialValue}>
					<Editable
						readOnly
						decorate={props.decorate}
						renderLeaf={props.renderLeaf}
						renderElement={props.renderElement}
						className={clsx(
							"px-2 py-1 font-normal text-white [overflow-wrap:anywhere]",
							isSelf ? "bg-primary" : "bg-background",
							props.currentNew && "rounded-tr-md",
							props.nextNew && "rounded-br-md rounded-bl-md ",
						)}
						disableDefaultStyles
					/>
				</Slate>
			</div>
		</div>
	);
}
