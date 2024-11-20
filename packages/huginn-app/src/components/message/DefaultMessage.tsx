import type { MessageRendererProps } from "@/types";
import { MessageFlags, clamp, hasFlag } from "@huginn/shared";
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

	const formattedTime = useMemo(() => moment(props.renderInfo.message?.createdAt).format("DD.MM.YYYY HH:mm"), [props.renderInfo.message]);
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

	return (
		<div
			className={clsx(
				"ml-2 flex flex-col items-start gap-y-2 p-2 hover:bg-secondary hover:shadow-lg",
				!isSelf && "ml-4",
				(isSeparate || isLastExotic) && "rounded-t-lg",
				isNextSeparate && "rounded-b-lg",
				!isSeparate && !isLastExotic && "mt-0.5 py-0",
				!isNextSeparate && "pb-0",
				isSeparate && !isNewDate && "mt-1.5",
			)}
		>
			{(isSeparate || isLastExotic) && (
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
					{!props.renderInfo.message.preview &&
					props.renderInfo.message.flags &&
					hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
						<IconMingcuteNotificationOffFill className="size-4 text-text" />
					) : null}
					<div className="text-text/50 text-xs">{formattedTime}</div>
				</div>
			)}
			<div className="overflow-hidden font-light text-white">
				<Slate editor={props.editor} initialValue={initialValue}>
					<Editable
						id={`${props.renderInfo.message.id}_inner`}
						readOnly
						decorate={props.decorate}
						renderLeaf={props.renderLeaf}
						renderElement={props.renderElement}
						className={clsx(
							"px-2.5 py-1.5 font-normal text-white [overflow-wrap:anywhere]",
							props.renderInfo.message.preview && "bg-primary/50 text-white/50",
							isSelf ? "bg-primary" : "bg-background",
							isSeparate && "!rounded-t-xl",
							isNextSeparate && "!rounded-b-xl",
						)}
						style={{
							borderBottomRightRadius: `${clamp(widths.width - widths.nextWidth, 0, 12)}px`,
							borderTopRightRadius: `${clamp(widths.width - widths.lastWidth, 0, 12)}px`,
						}}
						disableDefaultStyles
					/>
				</Slate>
			</div>
		</div>
	);
}
