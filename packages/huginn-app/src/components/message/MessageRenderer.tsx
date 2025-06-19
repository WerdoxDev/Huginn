import type { CustomElement, ParagraphElement } from "@/index";
import type { HuginnToken } from "@/types";
import AttachmentElement from "@components/editor/AttachmentElement";
import CodeElement from "@components/editor/CodeElement";
import EmbedElement from "@components/editor/EmbedElement";
import LinkElement from "@components/editor/LinkElement";
import MessageLeaf from "@components/editor/MessageLeaf";
import SpoilerElement from "@components/editor/SpoilerElement";
import { MessageContext } from "@contexts/messageProvider";
import { useIsInView } from "@hooks/useIsInView";
import { MessageType } from "@huginn/shared";
import { markdownMainMessage } from "@lib/markdown-main";
import { markdownSpoiler } from "@lib/markdown-spoiler";
import { markdownUnderline } from "@lib/markdown-underline";
import { getSlateFormats, isCloseToken, isElementCloseToken, isElementOpenToken, isOpenToken, organizeTokens } from "@lib/markdown-utils";
import markdownit from "markdown-it";
import { useCallback, useContext, useEffect, useLayoutEffect, useMemo } from "react";
import { type Descendant, type Editor, createEditor } from "slate";
import { DefaultElement, Editable, type RenderElementProps, type RenderLeafProps, Slate, withReact } from "slate-react";
import ActionMessage from "./ActionMessage";
import DefaultMessage from "./DefaultMessage";

const withHuginn = (editor: Editor) => {
	const { isInline, isVoid } = editor;

	editor.isInline = (element) => (element.type === "spoiler" || element.type === "link" ? true : isInline(element));
	editor.isVoid = (element) => (element.type === "embed" ? true : isVoid(element));

	return editor;
};

function MessageRenderer() {
	const context = useContext(MessageContext);
	const editor = useMemo(() => withReact(withHuginn(createEditor())), []);
	const isInView = useIsInView(context.ref);
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

		if (props.element.type === "attachment") {
			return <AttachmentElement {...props} />;
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
		let nodes: Descendant[] = [];

		const result = md.parse(context.renderInfo.message.content, {});
		const tokens = organizeTokens(result);

		let lineNode: ParagraphElement = { type: "paragraph", children: [] };
		const currentPath: number[] = [];
		const currentOpenedTokens: HuginnToken[] = [];

		for (const lineTokens of tokens) {
			if (lineTokens.length === 0) {
				lineNode.children.push({ text: "" });
				nodes.push({ ...lineNode });
				lineNode = { type: "paragraph", children: [] };
				continue;
			}

			for (const token of lineTokens) {
				const deepestNode = !currentPath.length ? lineNode : getNodeByPath(lineNode, currentPath);

				if (isElementOpenToken(token)) {
					if (token.type === "link_open") {
						deepestNode.children.push({ type: "link", children: [], url: token.attrs?.[0][1] });
					} else if (token.type === "spoiler_open") {
						deepestNode.children.push({ type: "spoiler", children: [] });
					} else if (token.type === "fence_open") {
						deepestNode.children.push({ type: "code", children: [{ text: "" }], code: token.content, language: token.info });
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

				// fence token is already finished from it's start because the code is passed as a whole
				if (token.type === "fence") {
					continue;
				}

				deepestNode.children.push({
					...getSlateFormats(currentOpenedTokens),
					text: token.content,
				});
			}

			if (lineNode.children.length) {
				nodes.push({ ...lineNode });
				currentPath.splice(0, currentPath.length);
				lineNode = { type: "paragraph", children: [] };
			}
		}

		// add the last line
		if (lineNode.children.length) {
			nodes.push(lineNode);
		}

		if (context.renderInfo.message.preview) {
			return nodes;
		}

		if (context.renderInfo.message.embeds.length === 1) {
			const embed = context.renderInfo.message.embeds[0];
			if ((embed.type === "image" || embed.type === "video") && embed.url === context.renderInfo.message.content) {
				nodes = [];
			}
		}

		for (const embed of context.renderInfo.message.embeds) {
			nodes.push({
				type: "embed",
				thumbnail: embed.thumbnail,
				video: embed.video,
				url: embed.url,
				description: embed.description,
				title: embed.title,
				children: [{ text: "" }],
			});
		}

		for (const attachment of context.renderInfo.message.attachments) {
			nodes.push({
				type: "attachment",
				url: attachment.url,
				description: attachment.description,
				children: [{ text: "" }],
				height: attachment?.height,
				width: attachment?.width,
				size: attachment.size,
				contentType: attachment.contentType,
				filename: attachment.filename,
			});
		}

		return nodes;
	}, [context.renderInfo.message]);

	useEffect(() => {
		if (!context.renderInfo.message.preview) {
			context.onVisibilityChanged(context.renderInfo.message.id, isInView);
		}
	}, [isInView, context.renderInfo.message.preview]);

	return (
		<li className="group shrink-0 select-text" ref={context.ref} id={context.renderInfo.message.id}>
			{(context.renderInfo.message.preview || [MessageType.DEFAULT].includes(context.renderInfo.message.type)) && (
				<DefaultMessage initialValue={initialValue} editor={editor} renderElement={renderElement} renderLeaf={renderLeaf} />
			)}
			{!context.renderInfo.message.preview &&
				[
					MessageType.RECIPIENT_ADD,
					MessageType.RECIPIENT_REMOVE,
					MessageType.CHANNEL_NAME_CHANGED,
					MessageType.CHANNEL_ICON_CHANGED,
					MessageType.CHANNEL_OWNER_CHANGED,
					MessageType.CALL,
				].includes(context.renderInfo.message.type) && <ActionMessage />}
		</li>
	);
}

export default MessageRenderer;
