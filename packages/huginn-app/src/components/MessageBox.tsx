import type { AppChannelMessage, AttachmentType, HuginnToken } from "@/types";
import { useEvent } from "@contexts/eventContext";
import { useSendMessage } from "@hooks/mutations/useSendMessage";
import { useSendTyping } from "@hooks/mutations/useSendTyping";
import { useChannelName } from "@hooks/useChannelName";
import { useCurrentChannel } from "@hooks/useCurrentChannel";
import { MessageFlags, isImageMediaType } from "@huginn/shared";
import { markdownMainEditor } from "@lib/markdown-main";
import { markdownSpoiler } from "@lib/markdown-spoiler";
import { markdownUnderline } from "@lib/markdown-underline";
import {
	getCodeLanguage,
	getHighlightedLineTokens,
	getSlateFormats,
	getTokenLength,
	hasMarkup,
	isCloseToken,
	isOpenToken,
	organizeTokens,
	splitHighlightedTokens,
} from "@lib/markdown-utils";
import { useHuginnWindow } from "@stores/windowStore";
import { getCurrentWebview } from "@tauri-apps/api/webview";
import { readFile } from "@tauri-apps/plugin-fs";
import clsx from "clsx";
import hljs from "highlight.js";
import markdownit from "markdown-it";
import mime from "mime";
import { normalize } from "pathe";
import { type ClipboardEvent, type KeyboardEvent, useCallback, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useParams } from "react-router";
import { type Descendant, Editor, Element, Node, type Path, type Range, createEditor } from "slate";
import { DefaultElement, Editable, type RenderElementProps, type RenderLeafProps, Slate, withReact } from "slate-react";
import AttachmentsPreview from "./AttachmentsPreview";
import DraggingIndicator from "./DraggingIndicator";
import EditorLeaf from "./editor/EditorLeaf";
import Tooltip from "./tooltip/Tooltip";

const initialValue: Descendant[] = [
	{
		type: "paragraph",
		children: [
			{
				text: "",
			},
		],
	},
];

let cache: { text: string; decorations: Record<number, Range[]> } | undefined = undefined;

type AttachmentInputType = { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> };

export default function MessageBox(props: { messages: AppChannelMessage[] }) {
	const editor = useMemo(() => withReact(createEditor()), []);
	const params = useParams();
	const md = useMemo(() => new markdownit({ linkify: true }).use(markdownSpoiler).use(markdownUnderline).use(markdownMainEditor), []);
	const editorRef = useRef<HTMLDivElement>(null);
	const thisRef = useRef<HTMLDivElement>(null);
	const { dispatchEvent } = useEvent();
	const currentChannel = useCurrentChannel();
	const channelName = useChannelName(currentChannel?.recipients, currentChannel?.name);
	const [attachments, setAttachments] = useState<AttachmentType[]>([]);
	const [dragging, setDragging] = useState(false);
	const huginnWindow = useHuginnWindow();
	const [isPending, startTransition] = useTransition();
	// const cache = useRef<{ text: string; decorations: Map<number, Range[]> }>(undefined);

	const sendMessageMutation = useSendMessage();
	const { reset: resetTyping, mutate: sendTypingMutate } = useSendTyping();

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <EditorLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		return <DefaultElement {...props} />;
	}, []);

	function getAllChildren() {
		const children = Array.from(
			Editor.nodes(editor, {
				at: [],
				mode: "highest",
				match: (node, path) => Element.isElement(node),
			}),
		);

		return children;
	}

	function calculateRanges() {
		const decorations: Record<number, Range[]> = {};
		const children = getAllChildren();

		const text = children.map((x) => Node.string(x[0])).join("\n");

		if (cache?.text === text) {
			return { ...cache.decorations };
		}

		const result = md.parse(text, {});
		console.log(result);
		const tokens = organizeTokens(result);

		for (const [i, lineTokens] of tokens.entries()) {
			const child = children.find((x) => x[1][0] === i);
			if (!child) {
				continue;
			}

			const ranges: Range[] = [];
			const path = child[1];

			let index = 0;
			const currentOpenedTokens: HuginnToken[] = [];

			for (const token of lineTokens) {
				if (token.type === "fence" && token.map) {
					const highlighted = hljs.highlight(token.content, { language: getCodeLanguage(token.info) ?? "md" });
					const parser = new DOMParser();

					const doc = parser.parseFromString(highlighted.value, "text/html");

					let tokens: Array<{ type: string; content: string | null }> = [];

					function parseNode(node: ChildNode): Array<{ type: string; content: string | null }> | { type: string; content: string | null } {
						if (node.nodeType === window.Node.ELEMENT_NODE) {
							const tokenType = (node as HTMLElement)?.className; // e.g., "hljs-keyword", "hljs-string"

							const onlyHasText = Array.from(node.childNodes).every((child) => child.nodeType === window.Node.TEXT_NODE);

							if (!onlyHasText) {
								return Array.from(node.childNodes)
									.flatMap(parseNode)
									.map((token: { type: string; content: string | null }) => ({
										type: token.type,
										content: token.content,
									}));
							}

							return { type: tokenType, content: node.textContent };
						}

						if (node.nodeType === window.Node.TEXT_NODE) {
							return [{ type: "text", content: node.textContent }];
						}

						return [];
					}

					tokens = Array.from(doc.body.childNodes).flatMap((node) => parseNode(node));

					tokens = splitHighlightedTokens(tokens);
					tokens = getHighlightedLineTokens(tokens, i - (token.map[0] + 1));

					let codeIndex = 0;
					for (const token of tokens) {
						ranges.push({
							anchor: { path, offset: codeIndex },
							focus: { path, offset: codeIndex + (token.content?.length ?? 0) },
							codeToken: token.type,
						});
						codeIndex += token.content?.length ?? 0;
					}

					continue;
				}

				const currentTokenEnd = getTokenLength(token);

				if (isOpenToken(token) || isCloseToken(token)) {
					if (hasMarkup(token.markup)) {
						ranges.push({
							mark: true,
							anchor: { path, offset: index },
							focus: { path, offset: index + currentTokenEnd },
						});
					}

					if (isOpenToken(token)) {
						currentOpenedTokens.push(token);
					} else if (isCloseToken(token)) {
						currentOpenedTokens.pop();
					}

					if (token.type === "fence_open" && getCodeLanguage(token.info)) {
						ranges.push({
							codeLanguage: true,
							anchor: { path, offset: index + 3 },
							focus: { path, offset: index + 3 + token.info.length },
						});
					}
				}

				// Links have an special href which include the actual whole link instead of the normalized one
				if (token.type === "link_open") {
					ranges.push({
						...getSlateFormats(currentOpenedTokens),
						anchor: { path, offset: index },
						focus: { path, offset: index + currentTokenEnd },
					});

					index += currentTokenEnd;
					continue;
				}

				if (token.content) {
					ranges.push({
						...getSlateFormats(currentOpenedTokens),
						anchor: { path, offset: index },
						focus: { path, offset: index + currentTokenEnd },
					});
				}
				index += currentTokenEnd;
			}

			decorations[i] = ranges;
		}

		cache = { text, decorations: decorations };

		return decorations;
	}

	function decorate([node, path]: [Node, Path]) {
		const ranges = calculateRanges();

		if (path[0] in ranges) {
			return [...ranges[path[0]]];
		}

		return [];
	}

	function onKeyDown(event: KeyboardEvent) {
		if (!event.shiftKey && event.code === "Enter") {
			event.preventDefault();
			const flags: MessageFlags = event.ctrlKey ? MessageFlags.SUPPRESS_NOTIFICATIONS : MessageFlags.NONE;
			sendMessage(flags);
		}

		if (event.ctrlKey && event.key === "b" && editor.selection) {
			toggleMarkAtSelection("bold");
		}
		if (event.ctrlKey && event.key === "i" && editor.selection) {
			toggleMarkAtSelection("italic");
		}
		if (event.ctrlKey && event.key === "u" && editor.selection) {
			toggleMarkAtSelection("underline");
		}
		if (event.key === "Escape") {
			setAttachments([]);
		}

		sendTypingMutate(event, { channelId: params.channelId ?? "" });
	}

	function toggleMarkAtSelection(markType: "bold" | "italic" | "underline") {
		if (!editor.selection) {
			return;
		}

		const mark = markType === "bold" ? "**" : markType === "italic" ? "*" : markType === "underline" ? "__" : "";
		const markLength = mark.length;
		const path = editor.selection.anchor.path;
		const nodeAtSelection = editor.leaf(editor.selection);

		for (const node of editor.nodes({ at: editor.selection, mode: "lowest" })) {
			const decoration = decorate(node).find(
				(x) => (x.bold && markType === "bold") || (x.italic && markType === "italic") || (x.underline && markType === "underline"),
			);

			const startOffset = Math.min(editor.selection.anchor.offset, editor.selection.focus.offset);
			const endOffset = Math.max(editor.selection.anchor.offset, editor.selection.focus.offset);

			if (!decoration) {
				editor.insertText(mark, { at: { offset: startOffset, path: path } });

				editor.insertText(mark, { at: { offset: endOffset + markLength, path: path } });
				editor.select({ anchor: { offset: startOffset + markLength, path: path }, focus: { offset: endOffset + markLength, path: path } });
				return;
			}

			const nodeText = nodeAtSelection[0].text;
			const actualText = nodeText.slice(startOffset, endOffset);
			const guessText = nodeText.slice(Math.max(startOffset - markLength, 0), endOffset + markLength);
			if (guessText === `${mark}${actualText}${mark}`) {
				editor.delete({ at: { anchor: { offset: startOffset - markLength, path: path }, focus: { offset: startOffset, path: path } } });
				editor.delete({ at: { anchor: { offset: endOffset - markLength, path: path }, focus: { offset: endOffset, path: path } } });
				return;
			}
		}
	}

	function sendMessage(flags: MessageFlags) {
		const content = serialize(editor.children);
		if (!content && !attachments.length) {
			return;
		}

		sendMessageMutation.mutate({
			channelId: params.channelId ?? "",
			content,
			flags,
			attachments: attachments.map((x) => ({
				id: x.id,
				contentType: x.contentType,
				data: x.arrayBuffer,
				filename: x.filename,
				description: x.description,
			})),
		});

		resetTyping();

		editor.delete({
			at: {
				anchor: Editor.start(editor, []),
				focus: Editor.end(editor, []),
			},
		});
	}

	function serialize(nodes: Descendant[]) {
		return nodes.map((n) => Node.string(n)).join("\n");
	}

	function addFiles() {
		const input = document.createElement("input");
		input.type = "file";
		input.multiple = true;
		// input.accept = "image/png,image/jpeg,image/webp,image/gif";

		input.onchange = async (e) => {
			const inputFiles = (e.target as HTMLInputElement).files;
			if (!inputFiles) return;

			await addAttachments(Array.from(inputFiles));
		};

		input.click();
	}

	async function addAttachments(input: AttachmentInputType[]) {
		startTransition(async () => {
			const attachments: AttachmentType[] = [];
			for (const [i, file] of input.entries()) {
				const arrayBuffer = await file.arrayBuffer();
				if (!isImageMediaType(file.type)) {
					attachments.push({ id: i, arrayBuffer: arrayBuffer, dataUrl: undefined, filename: file.name, contentType: file.type });
					continue;
				}

				const reader = new FileReader();
				reader.readAsDataURL(new Blob([arrayBuffer]));

				const dataUrl = await new Promise<string>((res, rej) => {
					reader.onload = (readerEvent) => {
						const content = readerEvent.target?.result;
						if (typeof content === "string") {
							res(content);
						}
					};

					reader.onerror = () => {
						rej();
					};
				});

				attachments.push({ id: i, arrayBuffer: arrayBuffer, dataUrl: dataUrl, filename: file.name, contentType: file.type });
			}

			setAttachments(attachments);
			editorRef.current?.focus();
		});
	}

	function removeAttachment(id: number) {
		setAttachments((old) => old.filter((x) => x.id !== id));
	}

	function onPaste(e: ClipboardEvent) {
		addAttachments(Array.from(e.clipboardData.files));
	}

	// This is to match the updating of channel messages and message box in a single frame so that upon rendering a new preview message,
	// the attachments are also cleared. So eveything happens in one frame.
	useEffect(() => {
		setAttachments([]);
	}, [props.messages]);

	// Focus on the messagebox when we change channel
	useEffect(() => {
		editorRef.current?.focus();
	}, [currentChannel?.id]);

	useEffect(() => {
		if (!thisRef.current) return;
		let lastHeight = thisRef.current.clientHeight;

		const resizeObserver = new ResizeObserver((entries) => {
			const height = entries[0].target.clientHeight;
			dispatchEvent("message_box_height_changed", { difference: height - lastHeight });
			lastHeight = height;
		});

		const unlisten =
			huginnWindow.environment === "desktop"
				? getCurrentWebview().onDragDropEvent(async (e) => {
						if (e.payload.type === "enter") {
							setDragging(true);
						} else if (e.payload.type === "leave") {
							setDragging(false);
						} else if (e.payload.type === "drop") {
							const files: AttachmentInputType[] = [];
							setDragging(false);
							for (const path of e.payload.paths) {
								const filename = normalize(path).split("/").pop();
								const file = await readFile(path);
								const type = mime.getType(filename);

								if (!type) {
									continue;
								}

								files.push({ name: filename, type: type, arrayBuffer: async () => file.buffer as ArrayBuffer });
							}

							addAttachments(files);
						}
					})
				: undefined;
		// const unlisten = listenEvent("files_dragged", (d) => {
		// 	addAttachments(d.files);
		// });

		resizeObserver.observe(thisRef.current);

		return () => {
			resizeObserver.disconnect();
			unlisten?.then((f) => f());
		};
	}, []);

	return (
		<div className="bottom-0 z-10 flex-col px-5 py-1.5" ref={thisRef}>
			<DraggingIndicator isDragging={dragging} />
			<AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />
			<form className="w-full">
				<div
					className={clsx(
						"flex h-full items-start rounded-3xl border-2 border-background bg-tertiary transition-[border-radius]",
						attachments.length && "rounded-t-none",
					)}
				>
					<Tooltip>
						<Tooltip.Trigger
							onClick={addFiles}
							type="button"
							className="m-2 mr-2 flex shrink-0 cursor-pointer items-center rounded-full bg-background p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl"
						>
							<IconMingcuteAddFill name="gravity-ui:plus" className="h-5 w-5 text-text" />
						</Tooltip.Trigger>
						<Tooltip.Content>Upload Files</Tooltip.Content>
					</Tooltip>
					<div className="h-full w-full overflow-hidden">
						<Slate editor={editor} initialValue={initialValue}>
							<Editable
								onPaste={onPaste}
								ref={editorRef}
								placeholder={`Message ${channelName}`}
								className="h-full whitespace-break-spaces py-3 font-light text-white leading-[24px] caret-white outline-none"
								renderLeaf={renderLeaf}
								renderElement={renderElement}
								decorate={decorate}
								onKeyDown={onKeyDown}
								renderPlaceholder={({ children, attributes }) => <div {...attributes}>{children}</div>}
								disableDefaultStyles
							/>
						</Slate>
					</div>
					<div className="ml-2 flex h-8 gap-x-2 p-2">
						<div className="h-8 w-8 rounded-full bg-background" />
						<div className="h-8 w-8 rounded-full bg-background" />
						<button className="h-8 w-8 rounded-full bg-primary p-0.5" type="button" onClick={() => sendMessage(MessageFlags.NONE)}>
							<IconLetsIconsSendHorFill className="size-full text-text" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
