import UserAvatar from "@components/UserAvatar";
import { MessageContext } from "@contexts/messageProvider";
import { useUser } from "@hooks/api-hooks/userHooks";
import { clamp, hasFlag, MessageFlags } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import moment from "moment";
import { useContext, useLayoutEffect, useMemo, useState } from "react";
import type { BaseEditor, Descendant } from "slate";
import { Editable, type ReactEditor, type RenderElementProps, type RenderLeafProps, Slate } from "slate-react";
import AttachmentUploadProgress from "./AttachmentUploadProgress";

export default function DefaultMessage(props: {
	initialValue: Descendant[];
	editor: BaseEditor & ReactEditor;
	renderLeaf(props: RenderLeafProps): React.JSX.Element;
	renderElement(props: RenderElementProps): React.JSX.Element;
}) {
	const { user } = useThisUser();
	const context = useContext(MessageContext);

	const formattedTime = useMemo(() => moment(context.renderInfo.message?.timestamp).format("DD.MM.YYYY HH:mm"), [context.renderInfo.message]);

	const author = useUser(context.renderInfo.message.authorId);
	const isSelf = useMemo(() => author?.id === user?.id, [author]);

	const isLastExotic = useMemo(() => context.lastRenderInfo?.exoticType === true, [context.lastRenderInfo]);
	const isSeparate = useMemo(() => context.renderInfo.newAuthor || context.renderInfo.newMinute || context.renderInfo.newDate, [context.renderInfo]);
	const isNextSeparate = useMemo(
		() => context.nextRenderInfo?.newAuthor || context.nextRenderInfo?.newMinute || !context.nextRenderInfo || context.nextRenderInfo.exoticType,
		[context.nextRenderInfo],
	);

	const isNewDate = useMemo(
		() => context.renderInfo.newDate || !context.lastRenderInfo || context.renderInfo.newDate,
		[context.renderInfo, context.lastRenderInfo],
	);

	const isUnread = useMemo(() => context.renderInfo.unread, [context.renderInfo]);

	const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number }>({ width: 0, lastWidth: 0, nextWidth: 0 });

	useLayoutEffect(() => {
		const width = document.getElementById(`${context.renderInfo.message.id}_inner`)?.clientWidth || 0;
		const lastWidth = document.getElementById(`${context.lastRenderInfo?.message.id}_inner`)?.clientWidth || 0;
		const nextWidth = document.getElementById(`${context.nextRenderInfo?.message.id}_inner`)?.clientWidth || 0;

		setWidths({ width, lastWidth, nextWidth });
	}, [context.renderInfo, context.lastRenderInfo, context.nextRenderInfo]);

	return (
		<div
			className={clsx(
				"group flex flex-col items-start gap-y-2 p-2 pl-4 hover:bg-secondary",
				!isSelf && "pl-6",
				(isSeparate || isLastExotic) && "rounded-tr-lg",
				isNextSeparate && "rounded-br-lg",
				!isSeparate && !isLastExotic && "py-0",
				// !isSeparate && !isLastExotic && !isUnread && "mt-0.5",
				!isNextSeparate && "pb-0",
				isSeparate && !isNewDate && !isUnread && "mt-1.5",
			)}
		>
			{(isSeparate || isLastExotic) && (
				<div className="flex items-center gap-x-2">
					<UserAvatar userId={context.renderInfo.message.authorId} avatarHash={author?.avatar} statusSize="0.5rem" size="1.75rem" />
					<div className="text-sm text-text">{isSelf ? "You" : (author?.displayName ?? author?.username)}</div>
					{!context.renderInfo.message.preview &&
					context.renderInfo.message.flags &&
					hasFlag(context.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMingcuteNotificationOffFill className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="font-light text-white">
				<SlateRenderer
					initialValue={props.initialValue}
					editor={props.editor}
					isNextSeparate={isNextSeparate}
					isSelf={isSelf}
					isSeparate={isSeparate}
					isUnread={isUnread}
					isLastExotic={isLastExotic}
					renderElement={props.renderElement}
					renderLeaf={props.renderLeaf}
					widths={widths}
				/>
			</div>
		</div>
	);
}

function SlateRenderer(props: {
	editor: ReactEditor;
	initialValue: Descendant[];
	renderLeaf(props: RenderLeafProps): React.JSX.Element;
	renderElement(props: RenderElementProps): React.JSX.Element;
	widths: { width: number; lastWidth: number; nextWidth: number };
	isSelf: boolean;
	isUnread: boolean;
	isSeparate: boolean;
	isNextSeparate: boolean;
	isLastExotic: boolean;
}) {
	const { messageUploadProgress: messageUploadProgresses } = useChannelStore();
	const context = useContext(MessageContext);
	const progress = useMemo(() => messageUploadProgresses[context.renderInfo.message.id], [messageUploadProgresses]);

	return (
		<div
			className={clsx(
				"wrap-anywhere relative whitespace-break-spaces px-2.5 py-1.5 font-normal text-white group-hover:shadow-sm",
				context.renderInfo.message.preview && "bg-primary/20 text-white/50",
				props.isSelf && !context.renderInfo.message.preview ? "bg-primary/70" : "bg-background shadow-background",
				props.isUnread && !props.isSeparate && "rounded-t-none!",
				(props.isSeparate || props.isLastExotic) && "rounded-t-xl!",
				props.isNextSeparate && "rounded-b-xl!",
			)}
			style={{
				borderBottomRightRadius: `${clamp((props.widths.width - props.widths.nextWidth) / 2, 0, 12)}px`,
				borderTopRightRadius: `${clamp((props.widths.width - props.widths.lastWidth) / 2, 0, 12)}px`,
			}}
		>
			{!props.isSeparate && props.widths.lastWidth > props.widths.width && (
				<div className="-right-10 absolute top-0 h-10 w-10 overflow-hidden">
					<div
						className="h-full w-full overflow-hidden [box-shadow:0_-20px_0_0_var(--tw-shadow-color)]"
						style={{
							borderTopLeftRadius: `${clamp((props.widths.lastWidth - props.widths.width) / 2, 0, 12)}px`,
						}}
					/>
				</div>
			)}
			{!props.isNextSeparate && props.widths.nextWidth > props.widths.width && (
				<div className="-right-10 absolute bottom-0 h-10 w-10 overflow-hidden">
					<div
						className="h-full w-full overflow-hidden [box-shadow:0_20px_0_0_var(--tw-shadow-color)]"
						style={{
							borderBottomLeftRadius: `${clamp((props.widths.nextWidth - props.widths.width) / 2, 0, 12)}px`,
						}}
					/>
				</div>
			)}

			{progress !== undefined ? (
				<AttachmentUploadProgress progress={progress} />
			) : (
				<Slate
					editor={props.editor}
					initialValue={props.initialValue}
					key={
						!context.renderInfo.message.preview ? (context.renderInfo.message.editedTimestamp as string) : context.renderInfo.message.timestamp
					}
				>
					<Editable
						id={`${context.renderInfo.message.id}_inner`}
						readOnly
						renderLeaf={props.renderLeaf}
						renderElement={props.renderElement}
						disableDefaultStyles
					/>
				</Slate>
			)}
		</div>
	);
}
