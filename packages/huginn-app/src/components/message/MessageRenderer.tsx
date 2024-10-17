import type { MessageRendererProps } from "@/types.ts";
import MessageLeaf from "@components/editor/MessageLeaf.tsx";
import DefaultMessage from "@components/message/DefaultMessage.tsx";
import UserActionMessage from "@components/message/UserActionMessage.tsx";
import { MessageType } from "@huginn/shared";
import { tokenize } from "@lib/huginn-tokenizer.ts";
import { clsx } from "@nick/clsx";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import { type Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, type RenderElementProps, type RenderLeafProps, withReact } from "slate-react";

const MessageRenderer = forwardRef<HTMLLIElement, MessageRendererProps>((props, ref) => {
	const editor = useMemo(() => withReact(createEditor()), []);

	const currentDefaultType = useMemo(() => props.renderInfo.message.type === MessageType.DEFAULT, [props.renderInfo]);

	const nextNew = useMemo(
		() =>
			props.nextRenderInfo?.newAuthor ||
			props.nextRenderInfo?.newMinute ||
			!props.nextRenderInfo ||
			props.nextRenderInfo.newType ||
			!currentDefaultType,
		[props.nextRenderInfo, currentDefaultType],
	);

	const currentNew = useMemo(
		() => props.renderInfo.newAuthor || props.renderInfo.newMinute || props.renderInfo.newDate || props.renderInfo.newType || !currentDefaultType,
		[props.renderInfo, currentDefaultType],
	);
	const currentNewDate = useMemo(() => props.renderInfo.newDate || !props.lastRenderInfo, [props.renderInfo.newDate, props.lastRenderInfo]);

	const lastRanges = useRef<Range[]>();

	const renderLeaf = useCallback((props: RenderLeafProps) => {
		return <MessageLeaf {...props} />;
	}, []);

	const renderElement = useCallback((props: RenderElementProps) => {
		return <DefaultElement {...props} />;
	}, []);

	function decorate([node, path]: [Node, Path]) {
		if (lastRanges.current) {
			return [...lastRanges.current];
		}

		const ranges: Range[] = [];

		if (!Text.isText(node)) {
			return ranges;
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

		lastRanges.current = ranges;

		return ranges;
	}

	return (
		<li
			ref={ref}
			className={clsx(
				"group select-text p-2 hover:bg-secondary",
				!nextNew && "pb-0.5",
				nextNew && "rounded-b-lg",
				!currentNew && "py-0.5",
				currentNew && "rounded-t-lg",
				currentNew && !currentNewDate && "mt-1.5",
			)}
		>
			{[MessageType.DEFAULT].includes(props.renderInfo.message.type) && (
				<DefaultMessage
					{...props}
					nextNew={nextNew}
					currentNew={currentNew}
					editor={editor}
					decorate={decorate}
					renderElement={renderElement}
					renderLeaf={renderLeaf}
				/>
			)}
			{[MessageType.RECIPIENT_ADD, MessageType.RECIPIENT_REMOVE].includes(props.renderInfo.message.type) && <UserActionMessage {...props} />}
		</li>
	);
});

export default MessageRenderer;
