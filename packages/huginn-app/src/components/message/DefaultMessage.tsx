import type { MessageRendererProps } from "@/types";
import UserAvatar from "@components/UserAvatar";
import { useUser } from "@hooks/api-hooks/userHooks";
import { MessageFlags, type Snowflake, clamp, hasFlag } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useSettings } from "@stores/settingsStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import moment from "moment";
import { useLayoutEffect, useMemo, useState } from "react";
import type { BaseEditor, Descendant } from "slate";
import { Editable, type ReactEditor, type RenderElementProps, type RenderLeafProps, Slate } from "slate-react";
import AttachmentUploadProgress from "./AttachmentUploadProgress";

export default function DefaultMessage(
	props: MessageRendererProps & {
		initialValue: Descendant[];
		editor: BaseEditor & ReactEditor;
		renderLeaf(props: RenderLeafProps): React.JSX.Element;
		renderElement(props: RenderElementProps): React.JSX.Element;
	},
) {
	const { user } = useThisUser();
	const settings = useSettings();

	// const isCompact = useMemo(() => settings.chatMode === "compact", [settings]);

	const formattedTime = useMemo(() => moment(props.renderInfo.message?.timestamp).format("DD.MM.YYYY HH:mm"), [props.renderInfo.message]);

	const author = useUser(props.renderInfo.message.authorId);
	const isSelf = useMemo(() => author?.id === user?.id, [author]);

	const isLastExotic = useMemo(() => props.lastRenderInfo?.exoticType === true, [props.lastRenderInfo]);
	const isSeparate = useMemo(() => props.renderInfo.newAuthor || props.renderInfo.newMinute || props.renderInfo.newDate, [props.renderInfo]);
	const isNextSeparate = useMemo(
		() => props.nextRenderInfo?.newAuthor || props.nextRenderInfo?.newMinute || !props.nextRenderInfo || props.nextRenderInfo.exoticType,
		[props.nextRenderInfo],
	);

	const isNewDate = useMemo(
		() => props.renderInfo.newDate || !props.lastRenderInfo || props.renderInfo.newDate,
		[props.renderInfo, props.lastRenderInfo],
	);

	const isUnread = useMemo(() => props.renderInfo.unread, [props.renderInfo]);

	const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number }>({ width: 0, lastWidth: 0, nextWidth: 0 });

	useLayoutEffect(() => {
		const width = document.getElementById(`${props.renderInfo.message.id}_inner`)?.clientWidth || 0;
		const lastWidth = document.getElementById(`${props.lastRenderInfo?.message.id}_inner`)?.clientWidth || 0;
		const nextWidth = document.getElementById(`${props.nextRenderInfo?.message.id}_inner`)?.clientWidth || 0;

		setWidths({ width, lastWidth, nextWidth });
	}, [props.renderInfo, props.lastRenderInfo, props.nextRenderInfo]);

	// return isCompact ? (
	// 	<div
	// 		className={clsx(
	// 			"group flex flex-col items-start gap-y-2 p-2 pl-4 hover:bg-secondary",
	// 			(isSeparate || isLastExotic) && "rounded-tr-lg",
	// 			isNextSeparate && "rounded-br-lg",
	// 			!isSeparate && !isLastExotic && "py-0",
	// 			!isSeparate && !isLastExotic && !isUnread && "mt-0",
	// 			!isNextSeparate && "pb-0",
	// 			isSeparate && !isNewDate && !isUnread && "mt-1.5",
	// 		)}
	// 	>
	// 		{(isSeparate || isLastExotic) && (
	// 			<div className="flex items-center justify-center gap-x-2">
	// 				<div className="text-sm text-text">
	// 					{isSelf ? "You" : (props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username)}
	// 				</div>
	// 				{!props.renderInfo.message.preview &&
	// 				props.renderInfo.message.flags &&
	// 				hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
	// 					<IconMingcuteNotificationOffFill className="size-4 text-text" />
	// 				) : null}
	// 				<div className="text-text/50 text-xs">{formattedTime}</div>
	// 			</div>
	// 		)}
	// 		<div className="flex gap-2">
	// 			{(isSeparate || isLastExotic) && (
	// 				<div className="flex gap-x-2 overflow-hidden">
	// 					<UserAvatar
	// 						userId={props.renderInfo.message.author.id}
	// 						avatarHash={props.renderInfo.message.author.avatar}
	// 						statusSize="0.5rem"
	// 						size="1.75rem"
	// 					/>
	// 				</div>
	// 			)}
	// 			<div className={clsx("font-light text-white", !isSeparate && !isLastExotic && "ml-9")}>
	// 				<MarkdownRenderer
	// 					initialValue={props.initialValue}
	// 					editor={props.editor}
	// 					isNextSeparate={isNextSeparate}
	// 					isPreview={props.renderInfo.message.preview}
	// 					isSelf={isSelf}
	// 					isSeparate={isSeparate}
	// 					isLastExotic={isLastExotic}
	// 					isUnread={isUnread}
	// 					messageId={props.renderInfo.message.id}
	// 					renderElement={props.renderElement}
	// 					renderLeaf={props.renderLeaf}
	// 					widths={widths}
	// 				/>
	// 			</div>
	// 		</div>
	// 	</div>
	// ) : (
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
					<UserAvatar userId={props.renderInfo.message.authorId} avatarHash={author?.avatar} statusSize="0.5rem" size="1.75rem" />
					<div className="text-sm text-text">{isSelf ? "You" : (author?.displayName ?? author?.username)}</div>
					{!props.renderInfo.message.preview &&
					props.renderInfo.message.flags &&
					hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMingcuteNotificationOffFill className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="font-light text-white">
				<MarkdownRenderer
					initialValue={props.initialValue}
					editor={props.editor}
					isNextSeparate={isNextSeparate}
					isPreview={props.renderInfo.message.preview}
					isSelf={isSelf}
					isSeparate={isSeparate}
					isUnread={isUnread}
					messageId={props.renderInfo.message.id}
					isLastExotic={isLastExotic}
					renderElement={props.renderElement}
					renderLeaf={props.renderLeaf}
					widths={widths}
				/>
			</div>
		</div>
	);
}

function MarkdownRenderer(props: {
	editor: ReactEditor;
	messageId: Snowflake;
	isPreview: boolean;
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
	const progress = useMemo(() => messageUploadProgresses[props.messageId], [messageUploadProgresses]);
	// console.log(props.widths.width - props.widths.nextWidth);
	// const progress: UploadProgress = { filenames: ["asd.png"], percentage: 1, total: 10000 };

	return (
		<div
			className={clsx(
				"relative whitespace-break-spaces px-2.5 py-1.5 font-normal text-white [overflow-wrap:anywhere] group-hover:shadow-lg",
				props.isPreview && "bg-primary/20 text-white/50",
				props.isSelf && !props.isPreview ? "bg-primary/70 shadow-primary/70" : "bg-background shadow-background",
				props.isUnread && !props.isSeparate && "!rounded-t-none",
				(props.isSeparate || props.isLastExotic) && "!rounded-t-xl",
				props.isNextSeparate && "!rounded-b-xl",
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
				<Slate editor={props.editor} initialValue={props.initialValue}>
					<Editable
						id={`${props.messageId}_inner`}
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
