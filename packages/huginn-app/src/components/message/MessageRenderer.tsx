import type { MessageRendererProps } from "@/types";
import EmbedElement from "@components/editor/EmbedElement";
import { MessageType } from "@huginn/shared";
import { type FinishedToken, type TokenType, mergeTokens } from "@lib/huginn-tokenizer";
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

	function getMappedTypes(types: TokenType[]) {
		return types.reduce(
			(acc, style) => {
				acc[style] = true;
				return acc;
			},
			{} as Record<string, boolean>,
		);
	}

	const initialValue = useMemo(() => {
		const nodes: Descendant[] = [];

		for (const line of props.renderInfo.message.content.split("\n")) {
			const node: Descendant = { type: "paragraph", children: [] };

			const tokens = mergeTokens(tokenize(line));

			for (const token of tokens) {
				if (token.types.includes("spoiler")) {
					node.children.push({
						type: "spoiler",
						children: [
							{
								text: token.content,
								...getMappedTypes(token.types),
								url: token.types.includes("link") || token.types.includes("mask_link") ? (token.data?.url ?? token.content) : undefined,
							},
						],
					});
				} else {
					node.children.push({
						text: token.content,
						...getMappedTypes(token.types),
						url: token.types.includes("link") || token.types.includes("mask_link") ? (token.data?.url ?? token.content) : undefined,
					});
				}
			}

			nodes.push(node);
		}

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
				height: embed.thumbnail?.height,
				width: embed.thumbnail?.width,
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
