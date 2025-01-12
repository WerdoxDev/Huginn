import type { CustomElement, ParagraphElement } from "@/index";
import type { MessageRendererProps } from "@/types";
import EmbedElement from "@components/editor/EmbedElement";
import { MessageType } from "@huginn/shared";
import markdownit from "markdown-it";
import type Token from "markdown-it/lib/token.mjs";
import { type Descendant, type Editor, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const withHuginn = (editor: Editor) => {
	const { isInline, isVoid } = editor;

	editor.isInline = (element) => (element.type === "spoiler" || element.type === "link" ? true : isInline(element));
	editor.isVoid = (element) => (element.type === "embed" ? true : isVoid(element));

	return editor;
};

function MessageRenderer(props: MessageRendererProps) {
	const editor = useMemo(() => withReact(withHuginn(createEditor())), []);
	const isInView = useIsInView(props.ref);
	const md = useMemo(() => new markdownit({ linkify: true }).use(markdownSpoiler).use(markdownUnderline).use(markdownMainMessage), []);

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

		if (props.element.type === "link") {
			return <LinkElement {...props} />;
		}

		if (props.element.type === "code") {
			return <CodeElement {...props} />;
		}

		return <DefaultElement {...props} />;
	}, []);

	function getNodeByPath(rootNode: CustomElement, path: number[]) {
		let current = rootNode;

		for (const index of path) {
			if (!Array.isArray(current.children) || current.children[index] === undefined) {
				throw new Error("Invalid path");
			}
			current = current.children[index] as CustomElement; // Navigate to the children
		}

		return current; // Returns the children array at the final path
	}

	const initialValue = useMemo(() => {
		const nodes: Descendant[] = [];

		const result = md.parse(props.renderInfo.message.content, {});
		const tokens = result.reduce((accumulator: Token[], token) => {
			if (token.type === "inline" || token.type === "paragraph_open" || token.type === "paragraph_close") accumulator.push(token);

			return accumulator;
		}, []);

		if (!tokens) {
			return [];
		}

		let lineNode: ParagraphElement = { type: "paragraph", children: [] };
		const currentPath: number[] = [];
		const currentOpenedTokens: Token[] = [];
		for (const [i, rootToken] of tokens.entries()) {
			// when a line is empty, the next line will start a new paragraph
			if (rootToken.type === "paragraph_close" && i !== tokens.length - 1) {
				if (lineNode.children.length) {
					nodes.push({ ...lineNode });
				}

				nodes.push({ type: "paragraph", children: [{ text: "" }] });
				lineNode = { type: "paragraph", children: [] };
			}

			if (!rootToken.children?.length) {
				continue;
			}

			for (const token of rootToken.children) {
				// softbreak is just \n inside a text
				if (token.type === "softbreak") {
					nodes.push({ ...lineNode });
					lineNode = { type: "paragraph", children: [] };
					continue;
				}

				const deepestNode = !currentPath.length ? lineNode : getNodeByPath(lineNode, currentPath);

				if (isElementOpenToken(token)) {
					if (token.type === "link_open") {
						deepestNode.children.push({ type: "link", children: [], url: token.attrs?.[0][1] });
					} else if (token.type === "spoiler_open") {
						deepestNode.children.push({ type: "spoiler", children: [] });
					}
					currentPath.push(deepestNode.children.length - 1);
					continue;
				}

				if (isElementCloseToken(token)) {
					currentPath.pop();
					continue;
				}

				if (isOpenToken(token) || isCloseToken(token)) {
					if (isOpenToken(token)) {
						currentOpenedTokens.push(token);
					} else if (isCloseToken(token)) {
						currentOpenedTokens.pop();
					}
					continue;
				}

				if (!token.content) {
					continue;
				}

				deepestNode.children.push({
					...getSlateFormats(currentOpenedTokens),
					text: token.content,
				});
			}
		}

		// add the last line
		if (lineNode.children.length) {
			nodes.push(lineNode);
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
