import type { MessageRendererProps } from "@/types";
import { MessageType, arrayEqual } from "@huginn/shared";
import type { RefObject } from "react";
import { type BasePoint, Editor, Element, type Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const withHuginn = (editor: Editor) => {
	const { isInline } = editor;

	editor.isInline = (element) => (element.type === "spoiler" ? true : isInline(element));

	return editor;
};

type SpoilerLocation = { anchor: BasePoint; focus: BasePoint };

function MessageRenderer(props: MessageRendererProps) {
	const editor = useMemo(() => withReact(withHuginn(createEditor())), []);
	const spoilerLocations = useRef<SpoilerLocation[]>([]);
	const isInView = useIsInView(props.ref);

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <MessageLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		if (props.element.type === "spoiler") {
			return <SpoilerElement {...props} />;
		}

		return <DefaultElement {...props} />;
	}, []);

	const decorate = useCallback(([node, path]: [Node, Path]) => {
		const ranges: Range[] = [];

		if (!Text.isText(node)) {
			return ranges;
		}

		const tokens = tokenize(node.text)?.sort((a, b) => a.start - b.start);
		const offsets: { from: number; offset: number }[] = [];

		for (const token of tokens ?? []) {
			const offset = offsets
				.filter((x) => x.from < token.start)
				.map((x) => x.offset)
				.reduce((a, b) => a + b, 0);

			for (const tokenType of token.type) {
				const location = { anchor: { path, offset: token.start - offset }, focus: { path, offset: token.end - offset + 1 } };
				if (tokenType === "spoiler" && path.length === 2) {
					if (!spoilerLocations.current.some((x) => arrayEqual(x.anchor.path, path) && x.anchor.offset === token.start)) {
						spoilerLocations.current.push({ anchor: { path, offset: token.start }, focus: { path, offset: token.end + 1 } });
						ranges.push({
							...location,
							text: token.content,
						});
						continue;
					}
				}
				ranges.push({
					[tokenType]: true,
					...location,
					text: token.content,
				});
			}

			offsets.push({ from: token.start, offset: token.mark?.length || 0 }, { from: token.end, offset: token.mark?.length || 0 });
		}

		return ranges;
	}, []);

	useEffect(() => {
		if (spoilerLocations.current.length === 0) return;

		// Remove last inserted spoilers
		let iterator = editor.nodes({ at: { anchor: editor.start([]), focus: editor.end([]) } });
		let result = iterator.next();
		while (!result.done) {
			if (Array.isArray(result.value)) {
				const [node, path] = result.value;
				if (Element.isElement(node) && node.type === "spoiler") {
					editor.unwrapNodes({ at: { path, offset: 0 }, match: (n) => !Editor.isEditor(n) && Element.isElement(n) && n.type === "spoiler" });
					iterator = editor.nodes({ at: { anchor: editor.start([]), focus: editor.end([]) } });
				}
			}
			result = iterator.next();
		}

		//TODO: This can become a generic thing to use for later with more kinds of element replacing markdown
		// Group each line of spoilers into an array resulting in an array of arrays
		const groupedSpoilers = [...spoilerLocations.current].reduce(
			(acc, item) => {
				const key = String(item.anchor.path[0]);
				if (!acc[key]) {
					acc[key] = [];
				}

				acc[key].push(item);

				return acc;
			},
			{} as { [key: string]: SpoilerLocation[] },
		);

		// Wrap and split nodes where ever a spoiler is seen
		for (const lineIndex of Object.keys(groupedSpoilers)) {
			let skipped = 0;
			for (const [i, spoiler] of groupedSpoilers[lineIndex].entries()) {
				const location: SpoilerLocation = {
					anchor: { path: [Number(lineIndex), i * 2], offset: spoiler.anchor.offset - skipped },
					focus: { path: [Number(lineIndex), i * 2], offset: spoiler.focus.offset - skipped },
				};

				editor.wrapNodes({ type: "spoiler", children: [{ text: "" }] }, { at: { ...location }, split: true });

				for (let j = i === 0 ? 0 : i * 2; j < (i === 0 ? 2 : i * 2 + 2); j++) {
					const node = editor.node({ path: [Number(lineIndex), j], offset: 0 })[0];
					if (Text.isText(node)) {
						skipped += node.text.length;
					} else if (Element.isElement(node)) {
						skipped += node.children[0].text.length;
					}
				}
			}
		}
	}, []);

	useEffect(() => {
		if (!props.renderInfo.message.preview) {
			props.onVisibilityChanged(props.renderInfo.message.id, isInView);
		}
	}, [isInView, props.renderInfo.message.preview]);

	return (
		<li className="group shrink-0 select-text" ref={props.ref} id={props.renderInfo.message.id}>
			{(props.renderInfo.message.preview || [MessageType.DEFAULT].includes(props.renderInfo.message.type)) && (
				<DefaultMessage {...props} editor={editor} decorate={decorate} renderElement={renderElement} renderLeaf={renderLeaf} />
			)}
			{!props.renderInfo.message.preview &&
				[
					MessageType.RECIPIENT_ADD,
					MessageType.RECIPIENT_REMOVE,
					MessageType.CHANNEL_NAME_CHANGED,
					MessageType.CHANNEL_ICON_CHANGED,
					MessageType.CHANNEL_OWNER_CHANGED,
				].includes(props.renderInfo.message.type) && <ActionMessage {...props} />}
		</li>
	);
}

export default MessageRenderer;
