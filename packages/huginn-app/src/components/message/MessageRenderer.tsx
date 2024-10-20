import type { MessageRendererProps } from "@/types";
import { MessageType } from "@huginn/shared";
import clsx from "clsx";
import { type Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const MessageRenderer = forwardRef<HTMLLIElement, MessageRendererProps>((props, ref) => {
	const editor = useMemo(() => withReact(createEditor()), []);

	const currentExotic = useMemo(() => props.renderInfo.exoticType, [props.renderInfo]);

	const nextConnectable = useMemo(
		() =>
			(props.renderInfo.exoticType === false && props.nextRenderInfo?.exoticType === false) ||
			(props.renderInfo.exoticType === true && props.nextRenderInfo?.exoticType === true),
		[props.renderInfo, props.nextRenderInfo],
	);

	const lastConnectable = useMemo(
		() =>
			(props.renderInfo.exoticType === false && props.lastRenderInfo?.exoticType === false) ||
			(props.renderInfo.exoticType === true && props.lastRenderInfo?.exoticType === true),
		[props.renderInfo, props.lastRenderInfo],
	);

	const nextNew = useMemo(() => props.nextRenderInfo?.newAuthor || props.nextRenderInfo?.newMinute || !props.nextRenderInfo, [props.nextRenderInfo]);
	const currentNew = useMemo(() => props.renderInfo.newAuthor || props.renderInfo.newMinute || props.renderInfo.newDate, [props.renderInfo]);
	const currentNewDate = useMemo(() => props.renderInfo.newDate || !props.lastRenderInfo || props.renderInfo.newDate, [props.lastRenderInfo]);

	const lastRanges = useRef<Range[]>();

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <MessageLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		return <DefaultElement {...props} />;
	}, []);

	function decorate([node, path]: [Node, Path]) {
		if (lastRanges.current) {
			return [...lastRanges.current];
		}

		const ranges: Range[] = [];

		if (!Text.isText(node)) {
			return ranges;
		}

		const tokens = tokenize(node.text).sort((a, b) => a.start - b.start);
		let skippedCharacters = 0;
		for (const token of tokens) {
			ranges.push({
				[token.type]: true,
				anchor: { path, offset: token.start - skippedCharacters },
				focus: { path, offset: token.end + 1 - skippedCharacters },
				text: token.content,
			});

			skippedCharacters += (token.mark?.length ?? 0) * 2;
		}

		lastRanges.current = ranges;

		return ranges;
	}

	return (
		<li
			ref={ref}
			className={clsx(
				"group select-text",
				// currentExotic ? "p-1 pl-2" : "p-2",
				// !nextNew && "pb-0.5",
				// !currentNew && "py-0.5",
				// (nextNew || !nextConnectable || currentExotic) && "rounded-b-lg",
				// (currentNew || !lastConnectable || currentExotic) && "rounded-t-lg",
				// ((currentNew && !currentExotic) || !lastConnectable) && !currentNewDate && "mt-1.5",
			)}
		>
			{[MessageType.DEFAULT].includes(props.renderInfo.message.type) && (
				<DefaultMessage {...props} editor={editor} decorate={decorate} renderElement={renderElement} renderLeaf={renderLeaf} />
			)}
			{[MessageType.RECIPIENT_ADD, MessageType.RECIPIENT_REMOVE].includes(props.renderInfo.message.type) && <UserActionMessage {...props} />}
		</li>
	);
});

export default MessageRenderer;
