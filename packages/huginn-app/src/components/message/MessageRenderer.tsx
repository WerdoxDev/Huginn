import type { MessageRendererProps } from "@/types";
import { MessageType } from "@huginn/shared";
import { type Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const MessageRenderer = forwardRef<HTMLLIElement, MessageRendererProps>((props, ref) => {
	const editor = useMemo(() => withReact(createEditor()), []);

	const lastRanges = useRef<Range[]>([]);

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <MessageLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		return <DefaultElement {...props} />;
	}, []);

	function decorate([node, path]: [Node, Path]) {
		const ranges: Range[] = [];

		if (!Text.isText(node)) {
			return ranges;
		}

		if (lastRanges.current?.some((x) => x.anchor.path[0] === path[0] && x.anchor.path[1] === path[1])) {
			return [...lastRanges.current.filter((x) => x.anchor.path[0] === path[0] && x.anchor.path[1] === path[1])];
		}

		const tokens = tokenize(node.text).sort((a, b) => a.start - b.start);

		// __hi **bro** *a* vg__**tf**
		// hi **bro** vg__**tf** //startOffset: 2, endOffset: 16
		// hi bro** *a* vg__**tf** //
		const offsets: { from: number; offset: number }[] = [];
		for (const token of tokens) {
			const offset = offsets
				.filter((x) => x.from < token.start)
				.map((x) => x.offset)
				.reduce((a, b) => a + b, 0);

			console.log(token, offset);

			for (const tokenType of token.type) {
				ranges.push({
					[tokenType]: true,
					anchor: { path, offset: token.start - offset },
					focus: { path, offset: token.end - offset + 1 },
					text: token.content,
				});
			}

			offsets.push({ from: token.start, offset: token.mark?.length || 0 }, { from: token.end, offset: token.mark?.length || 0 });
			// if (token.end - startOffset > endOffset) {
			// 	endOffset = token.end - startOffset;
			// } else {
			// 	// endOffset -= token.mark?.length || 0;
			// }
		}
		// ranges.push({
		// 	underline: true,
		// 	anchor: { path, offset: 0 },
		// 	focus: { path, offset: 17 },
		// 	text: "hi **bro** vg",
		// });
		// ranges.push({
		// 	bold: true,
		// 	anchor: { path, offset: 3 },
		// 	focus: { path, offset: 10 },
		// 	text: "bro",
		// });
		// ranges.push({
		// 	bold: true,
		// 	anchor: { path, offset: 9 },
		// 	focus: { path, offset: 15 },
		// 	text: "tf",
		// });
		// let skippedCharacters = 0;
		// for (const token of tokens) {
		// 	for (const tokenType of token.type) {
		// 		ranges.push({
		// 			[tokenType]: true,
		// 			anchor: { path, offset: token.start - skippedCharacters },
		// 			focus: { path, offset: token.end + 1 - skippedCharacters },
		// 			// text: token.content,
		// 		});
		// 	}

		// 	// skippedCharacters += (token.mark?.length ?? 0) * 2;
		// }

		lastRanges.current.push(...ranges);

		return [...lastRanges.current.filter((x) => x.anchor.path[0] === path[0] && x.anchor.path[1] === path[1])];
	}

	return (
		<li ref={ref} className="group select-text">
			{[MessageType.DEFAULT].includes(props.renderInfo.message.type) && (
				<DefaultMessage {...props} editor={editor} decorate={decorate} renderElement={renderElement} renderLeaf={renderLeaf} />
			)}
			{[
				MessageType.RECIPIENT_ADD,
				MessageType.RECIPIENT_REMOVE,
				MessageType.CHANNEL_NAME_CHANGED,
				MessageType.CHANNEL_ICON_CHANGED,
				MessageType.CHANNEL_OWNER_CHANGED,
			].includes(props.renderInfo.message.type) && <UserActionMessage {...props} />}
		</li>
	);
});

export default MessageRenderer;
