import { MessageFlags } from "@huginn/shared";
import { TokenTypeFlag } from "@lib/huginn-tokenizer";
import type { KeyboardEvent } from "react";
import { useParams } from "react-router";
import { type Descendant, Editor, Node, type Path, type Range, Text, createEditor, start } from "slate";
import { DefaultElement, Editable, type RenderElementProps, type RenderLeafProps, Slate, withReact } from "slate-react";

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

export default function MessageBox() {
	const editor = useMemo(() => withReact(createEditor()), []);
	const params = useParams();

	const sendMessageMutation = useSendMessage();
	const { reset: resetTyping, mutate: sendTypingMutate } = useSendTyping();

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <EditorLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		return <DefaultElement {...props} />;
	}, []);

	const decorate = useCallback(([node, path]: [Node, Path]) => {
		const ranges: Range[] = [];

		if (!Text.isText(node)) {
			return ranges;
		}

		const tokens = tokenize(node.text);

		for (const token of tokens ?? []) {
			const markLength = token.mark?.length ?? 0;
			const end = token.end + 1;

			ranges.push({
				mark: true,
				anchor: { path, offset: token.start },
				focus: { path, offset: token.start + markLength },
			});
			ranges.push({
				mark: true,
				anchor: { path, offset: end - markLength },
				focus: { path, offset: end },
			});

			for (const tokenType of token.type) {
				ranges.push({
					[tokenType]: true,
					anchor: { path, offset: token.start + markLength },
					focus: { path, offset: end - markLength },
				});
			}
		}

		return ranges;
	}, []);

	function onKeyDown(event: KeyboardEvent) {
		if (!event.shiftKey && event.code === "Enter") {
			event.preventDefault();
			const flags: MessageFlags = event.ctrlKey ? MessageFlags.SUPPRESS_NOTIFICATIONS : MessageFlags.NONE;
			sendMessage(flags);
		}

		if (event.ctrlKey && event.key === "b" && editor.selection) {
			toggleMarkAtSelection("**");
		}
		if (event.ctrlKey && event.key === "i" && editor.selection) {
			toggleMarkAtSelection("*");
		}

		sendTypingMutate(event, { channelId: params.channelId ?? "" });
	}

	function toggleMarkAtSelection(mark: string) {
		if (!editor.selection) {
			return;
		}

		const markLength = mark.length;
		const path = editor.selection.anchor.path;
		const nodeAtSelection = editor.leaf(editor.selection);
		const startOffset = Math.min(editor.selection.anchor.offset, editor.selection.focus.offset);
		const endOffset = Math.max(editor.selection.anchor.offset, editor.selection.focus.offset);

		const nodeText = nodeAtSelection[0].text;
		const actualText = nodeText.slice(startOffset, endOffset);
		const guessText = nodeText.slice(Math.max(startOffset - markLength, 0), endOffset + markLength);
		if (guessText === `${mark}${actualText}${mark}`) {
			editor.delete({ at: { anchor: { offset: startOffset - markLength, path: path }, focus: { offset: startOffset, path: path } } });
			editor.delete({ at: { anchor: { offset: endOffset - markLength, path: path }, focus: { offset: endOffset, path: path } } });
			return;
		}

		editor.insertText(mark, { at: { offset: startOffset, path: path } });

		editor.insertText(mark, { at: { offset: endOffset + markLength, path: path } });
		editor.select({ anchor: { offset: startOffset + markLength, path: path }, focus: { offset: endOffset + markLength, path: path } });
	}

	function sendMessage(flags: MessageFlags) {
		const content = serialize(editor.children);
		if (!content) {
			return;
		}

		sendMessageMutation.mutate({ channelId: params.channelId ?? "", content, flags });
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

	return (
		<div className="relative mx-5 mr-64 flex w-full flex-wrap-reverse py-2">
			<form className="absolute w-full">
				<div className="flex h-full items-start justify-center rounded-3xl bg-tertiary p-2 ring-2 ring-background">
					<div className="mr-2 flex shrink-0 cursor-pointer items-center rounded-full bg-background p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl">
						<IconMingcuteAddFill name="gravity-ui:plus" className="h-5 w-5 text-text" />
					</div>
					<div className="h-full w-full self-center overflow-hidden py-2">
						<Slate editor={editor} initialValue={initialValue}>
							<Editable
								placeholder="Message @Emam"
								className="font-light text-white leading-none caret-white outline-none"
								renderLeaf={renderLeaf}
								renderElement={renderElement}
								decorate={decorate}
								onKeyDown={onKeyDown}
							/>
						</Slate>
					</div>
					<div className="ml-2 flex gap-x-2">
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
