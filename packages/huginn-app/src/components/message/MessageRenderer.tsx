import type { MessageRendererProps } from "@/types";
import { MessageType } from "@huginn/shared";
import { intersect } from "@std/collections/intersect";
import clsx from "clsx";
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
