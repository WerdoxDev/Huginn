import { useSendMessage } from "@hooks/mutations/useSendMessage";
import { MessageFlags } from "@huginn/shared";
import { tokenize } from "@lib/huginn-tokenizer";
import { useParams } from "@tanstack/react-router";
import { type KeyboardEvent, useCallback, useMemo } from "react";
import { type Descendant, Editor, Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, Editable, type RenderElementProps, type RenderLeafProps, Slate, withReact } from "slate-react";
import EditorLeaf from "./editor/EditorLeaf";

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
	const params = useParams({ strict: false });

	const mutation = useSendMessage();

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

		for (const token of tokens) {
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
			ranges.push({
				[token.type]: true,
				anchor: { path, offset: token.start + markLength },
				focus: { path, offset: end - markLength },
			});
		}

		return ranges;
	}, []);

	function onKeyDown(event: KeyboardEvent) {
		if (!event.shiftKey && event.code === "Enter") {
			event.preventDefault();
			const flags: MessageFlags = event.ctrlKey ? MessageFlags.SUPPRESS_NOTIFICATIONS : MessageFlags.NONE;
			sendMessage(flags);
		}
	}

	function sendMessage(flags: MessageFlags) {
		mutation.mutate({ channelId: params.channelId, content: serialize(editor.children), flags });
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
		<div className="relative mx-5 flex w-full flex-wrap-reverse py-2">
			<form className="absolute w-full">
				<div className="bg-tertiary ring-background flex h-full items-start justify-center rounded-3xl p-2 ring-2">
					<div className="bg-background mr-2 flex shrink-0 cursor-pointer items-center rounded-full p-1.5 transition-all hover:bg-white hover:bg-opacity-20 hover:shadow-xl">
						<IconGravityUiPlus name="gravity-ui:plus" className="text-text h-5 w-5" />
					</div>
					<div className="h-full w-full self-center overflow-hidden py-2">
						<Slate editor={editor} initialValue={initialValue}>
							<Editable
								placeholder="Message @Emam"
								className="font-light leading-none text-white caret-white outline-none"
								renderLeaf={renderLeaf}
								renderElement={renderElement}
								decorate={decorate}
								onKeyDown={onKeyDown}
							/>
						</Slate>
					</div>
					<div className="ml-2 flex gap-x-2">
						<div className="bg-background h-8 w-8 rounded-full" />
						<div className="bg-background h-8 w-8 rounded-full" />
						<button className="bg-primary h-8 w-8 rounded-full p-0.5" type="button" onClick={() => sendMessage(MessageFlags.NONE)}>
							<IconLetsIconsSendHorFill className="text-text size-full" />
						</button>
					</div>
				</div>
			</form>
		</div>
	);
}
