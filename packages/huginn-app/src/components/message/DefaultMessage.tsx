import type { MessageRendererProps } from "@/types";
import { MessageFlags, type Snowflake, clamp, hasFlag } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import type { BaseEditor, Descendant, NodeEntry, Range } from "slate";
import { Editable, type ReactEditor, type RenderElementProps, type RenderLeafProps, Slate } from "slate-react";

export default function DefaultMessage(
	props: MessageRendererProps & {
		editor: BaseEditor & ReactEditor;
		decorate(entry: NodeEntry): Range[];
		renderLeaf(props: RenderLeafProps): React.JSX.Element;
		renderElement(props: RenderElementProps): React.JSX.Element;
	},
) {
	const { user } = useUser();
	const settings = useSettings();

	const isCompact = useMemo(() => settings.chatMode === "compact", [settings]);

	const formattedTime = useMemo(() => moment(props.renderInfo.message?.timestamp).format("DD.MM.YYYY HH:mm"), [props.renderInfo.message]);
	const isSelf = useMemo(() => props.renderInfo.message.author.id === user?.id, [props.renderInfo.message.author]);

	const initialValue = useMemo(() => deserialize(props.renderInfo.message.content ?? ""), []);

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

	function deserialize(content: string): Descendant[] {
		return content.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
	}

	return isCompact ? (
		<div
			className={clsx(
				"ml-2 flex flex-col items-start gap-y-2 p-2 hover:bg-secondary hover:shadow-md",
				(isSeparate || isLastExotic) && "rounded-t-lg",
				isNextSeparate && "rounded-b-lg",
				!isSeparate && !isLastExotic && "py-0",
				!isSeparate && !isLastExotic && !isUnread && "mt-0",
				!isNextSeparate && "pb-0",
				isSeparate && !isNewDate && !isUnread && "mt-1.5",
			)}
		>
			{(isSeparate || isLastExotic) && (
				<div className="flex items-center justify-center gap-x-2">
					<div className="text-sm text-text">
						{isSelf ? "You" : (props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username)}
					</div>
					{!props.renderInfo.message.preview &&
					props.renderInfo.message.flags &&
					hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMingcuteNotificationOffFill className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="flex gap-2">
				{(isSeparate || isLastExotic) && (
					<div className="flex items-center gap-x-2 overflow-hidden">
						<UserAvatar
							userId={props.renderInfo.message.author.id}
							avatarHash={props.renderInfo.message.author.avatar}
							statusSize="0.5rem"
							size="1.75rem"
						/>
					</div>
				)}
				<div className={clsx("overflow-hidden font-light text-white", !isSeparate && !isLastExotic && "ml-9")}>
					<MarkdownRenderer
						decorate={props.decorate}
						editor={props.editor}
						initialValue={initialValue}
						isNextSeparate={isNextSeparate}
						isPreview={props.renderInfo.message.preview}
						isSelf={isSelf}
						isSeparate={isSeparate}
						isUnread={isUnread}
						messageId={props.renderInfo.message.id}
						renderElement={props.renderElement}
						renderLeaf={props.renderLeaf}
						widths={widths}
					/>
				</div>
			</div>
		</div>
	) : (
		<div
			className={clsx(
				"ml-2 flex flex-col items-start gap-y-2 p-2 hover:bg-secondary hover:shadow-md",
				!isSelf && "ml-4",
				(isSeparate || isLastExotic) && "rounded-t-lg",
				isNextSeparate && "rounded-b-lg",
				!isSeparate && !isLastExotic && "py-0",
				!isSeparate && !isLastExotic && !isUnread && "mt-0.5",
				!isNextSeparate && "pb-0",
				isSeparate && !isNewDate && !isUnread && "mt-1.5",
			)}
		>
			{(isSeparate || isLastExotic) && (
				<div className="flex items-center gap-x-2 overflow-hidden">
					<UserAvatar
						userId={props.renderInfo.message.author.id}
						avatarHash={props.renderInfo.message.author.avatar}
						statusSize="0.5rem"
						size="1.75rem"
					/>
					<div className="text-sm text-text">
						{isSelf ? "You" : (props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username)}
					</div>
					{!props.renderInfo.message.preview &&
					props.renderInfo.message.flags &&
					hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMingcuteNotificationOffFill className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="overflow-hidden font-light text-white">
				<MarkdownRenderer
					decorate={props.decorate}
					editor={props.editor}
					initialValue={initialValue}
					isNextSeparate={isNextSeparate}
					isPreview={props.renderInfo.message.preview}
					isSelf={isSelf}
					isSeparate={isSeparate}
					isUnread={isUnread}
					messageId={props.renderInfo.message.id}
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
	initialValue: Descendant[];
	messageId: Snowflake;
	isPreview: boolean;
	decorate(entry: NodeEntry): Range[];
	renderLeaf(props: RenderLeafProps): React.JSX.Element;
	renderElement(props: RenderElementProps): React.JSX.Element;
	widths: { width: number; lastWidth: number; nextWidth: number };
	isSelf: boolean;
	isUnread: boolean;
	isSeparate: boolean;
	isNextSeparate: boolean;
}) {
	return (
		<Slate editor={props.editor} initialValue={props.initialValue}>
			<Editable
				id={`${props.messageId}_inner`}
				readOnly
				decorate={props.decorate}
				renderLeaf={props.renderLeaf}
				renderElement={props.renderElement}
				className={clsx(
					"px-2.5 py-1.5 font-normal text-white [overflow-wrap:anywhere]",
					props.isPreview && "bg-primary/20 text-white/50",
					props.isSelf && !props.isPreview ? "bg-primary/70" : "bg-background",
					props.isUnread && !props.isSeparate && "!rounded-t-none",
					props.isSeparate && "!rounded-t-xl",
					props.isNextSeparate && "!rounded-b-xl",
				)}
				style={{
					borderBottomRightRadius: `${clamp(props.widths.width - props.widths.nextWidth, 0, 12)}px`,
					borderTopRightRadius: `${clamp(props.widths.width - props.widths.lastWidth, 0, 12)}px`,
				}}
				disableDefaultStyles
			/>
		</Slate>
	);
}
