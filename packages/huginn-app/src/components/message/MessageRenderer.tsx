import type { MessageRendererProps } from "@/types";
import EmbedElement from "@components/editor/EmbedElement";
import { MessageType } from "@huginn/shared";
import { mergeTokens } from "@lib/huginn-tokenizer";
import { type Descendant, type Editor, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const withHuginn = (editor: Editor) => {
	const { isInline, isVoid } = editor;

	editor.isInline = (element) => (element.type === "spoiler" ? true : isInline(element));
	editor.isVoid = (element) => (element.type === "embed" ? true : isVoid(element));

	return editor;
};

function MessageRenderer(props: MessageRendererProps) {
	const editor = useMemo(() => withReact(withHuginn(createEditor())), []);
	const isInView = useIsInView(props.ref);

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <MessageLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		if (props.element.type === "embed") {
			return <EmbedElement {...props} />;
		}

		if (props.element.type === "spoiler") {
			return <SpoilerElement {...props} />;
		}

		return <DefaultElement {...props} />;
	}, []);

	const initialValue = useMemo(() => {
		const nodes: Descendant[] = [];

		for (const line of props.renderInfo.message.content.split("\n")) {
			const tokens = mergeTokens(tokenize(line));
			if (tokens.length === 0) {
				nodes.push({ type: "paragraph", children: [{ text: line }] });
				continue;
			}

			const node: Descendant = { type: "paragraph", children: [] };
			let lastTokenEnd = undefined;

			for (const token of tokens) {
				if (token.start !== 0 || lastTokenEnd) {
					node.children.push({ text: line.slice(lastTokenEnd, token.start) });
				}
				lastTokenEnd = token.end + 1;

				const types = token.type.reduce(
					(acc, style) => {
						acc[style] = true;
						return acc;
					},
					{} as Record<string, boolean>,
				);

				if (token.type.includes("spoiler")) {
					node.children.push({ type: "spoiler", children: [{ text: token.content, ...types }] });
				} else {
					node.children.push({ text: token.content, ...types });
				}
			}

			if (lastTokenEnd !== line.length) {
				node.children.push({ text: line.slice(lastTokenEnd) });
			}
			nodes.push(node);
		}

		console.log(props.renderInfo.message.preview);
		if (props.renderInfo.message.preview) {
			return nodes;
		}

		for (const embed of props.renderInfo.message.embeds) {
			nodes.push({
				type: "embed",
				image: embed.thumbnail?.url,
				url: embed.url,
				description: embed.description,
				title: embed.title,
				children: [{ text: "" }],
			});
		}

		return nodes;
	}, []);

	useEffect(() => {
		if (!props.renderInfo.message.preview) {
			props.onVisibilityChanged(props.renderInfo.message.id, isInView);
		}
	}, [isInView, props.renderInfo.message.preview]);

	return (
		<li className="group shrink-0 select-text" ref={props.ref} id={props.renderInfo.message.id}>
			{(props.renderInfo.message.preview || [MessageType.DEFAULT].includes(props.renderInfo.message.type)) && (
				<DefaultMessage {...props} initialValue={initialValue} editor={editor} renderElement={renderElement} renderLeaf={renderLeaf} />
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
