import type { MessageRenderInfo } from "@/types";
import { useUser } from "@contexts/userContext";
import { MessageFlags, hasFlag } from "@huginn/shared";
import { tokenize } from "@lib/huginn-tokenizer";
import clsx from "clsx";
import moment from "moment";
import { forwardRef, useCallback, useMemo, useRef } from "react";
import { type Descendant, type Node, type Path, type Range, Text, createEditor } from "slate";
import { DefaultElement, Editable, type RenderElementProps, type RenderLeafProps, Slate, withReact } from "slate-react";
import UserAvatarWithStatus from "./UserAvatarWithStatus";
import MessageLeaf from "./editor/MessageLeaf";

const BaseMessage = forwardRef<
	HTMLLIElement,
	{
		renderInfo: MessageRenderInfo;
		nextRenderInfo?: MessageRenderInfo;
		lastRenderInfo?: MessageRenderInfo;
	}
>((props, ref) => {
	const { user } = useUser();

	const isSelf = useMemo(() => props.renderInfo.message.author.id === user?.id, [props.renderInfo.message.author]);
	const editor = useMemo(() => withReact(createEditor()), []);

	const initialValue = useMemo(() => deserialize(props.renderInfo.message.content ?? ""), []);
	const newAuthor = useMemo(
		() => props.renderInfo.message.author.id !== props.lastRenderInfo?.message.author.id,
		[props.renderInfo, props.lastRenderInfo],
	);
	const nextNewAuthor = useMemo(
		() => props.renderInfo.message.author.id !== props.nextRenderInfo?.message.author.id,
		[props.renderInfo, props.nextRenderInfo],
	);

	const lastRanges = useRef<Range[]>();

	// const formattedTime = useMemo(() => {
	//    const date = new Date(props.createdAt);

	//    const day = String(date.getDate()).padStart(2, "0");
	//    const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are zero-indexed
	//    const year = date.getFullYear();

	//    const hours = String(date.getHours()).padStart(2, "0");
	//    const minutes = String(date.getMinutes()).padStart(2, "0");

	//    return `${day}.${month}.${year} ${hours}:${minutes}`;
	// }, [props.createdAt]);

	const formattedTime = useMemo(() => moment(props.renderInfo.message.createdAt).format("DD.MM.YYYY HH:mm"), [props.renderInfo.message.createdAt]);

	function deserialize(content: string): Descendant[] {
		return content.split("\n").map((line) => ({ type: "paragraph", children: [{ text: line }] }));
	}

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
				"hover:bg-secondary group select-text p-2",
				(!nextNewAuthor || props.renderInfo.newMinute) && props.nextRenderInfo?.newMinute === false && "pb-0.5",
				(newAuthor || props.renderInfo.newMinute || props.renderInfo.newDate) && "rounded-t-lg",
				!newAuthor && !props.renderInfo.newMinute && "py-0.5",
				(nextNewAuthor || props.nextRenderInfo?.newMinute || props.nextRenderInfo?.newMinute === undefined) && "rounded-b-lg",
				((newAuthor && props.lastRenderInfo !== undefined) ||
					(props.renderInfo.newMinute && props.lastRenderInfo?.newMinute === false && !props.renderInfo.newDate)) &&
					"mt-1.5",
			)}
		>
			<div className={clsx("flex flex-col items-start gap-y-2 ", !isSelf && "ml-2")}>
				{(props.renderInfo.newMinute || newAuthor) && (
					<div className="flex items-center gap-x-2 overflow-hidden">
						<UserAvatarWithStatus
							userId={props.renderInfo.message.author.id}
							avatarHash={props.renderInfo.message.author.avatar}
							statusSize="0.5rem"
							size="1.75rem"
						/>
						<div className="text-text text-sm">
							{isSelf ? "You" : (props.renderInfo.message.author.displayName ?? props.renderInfo.message.author.username)}
						</div>
						{props.renderInfo.message.flags && hasFlag(props.renderInfo.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
							<IconMdiNotificationsOff className="text-text size-4" />
						) : null}
						<div className="text-text/50 text-xs">{formattedTime}</div>
					</div>
				)}
				{/* <div className="flex flex-col items-start gap-y-0.5"> */}
				<div className="overflow-hidden font-light text-white">
					<Slate editor={editor} initialValue={initialValue}>
						<Editable
							// onMouseDown={(e) => e.preventDefault()}
							// onClick={(e) => e.preventDefault()}
							readOnly
							decorate={decorate}
							renderLeaf={renderLeaf}
							renderElement={renderElement}
							className={clsx(
								"px-2 py-1 font-normal text-white [overflow-wrap:anywhere]",
								isSelf ? "bg-primary" : "bg-background",
								(newAuthor || props.renderInfo.newMinute) && "rounded-tr-md",
								(nextNewAuthor || props.nextRenderInfo?.newMinute || props.nextRenderInfo?.newMinute === undefined) &&
									"rounded-bl-md rounded-br-md ",
							)}
							disableDefaultStyles
							// className=""
						/>
					</Slate>
					{/* <div
                  className={clsx(
                     "px-2 py-1 font-normal text-white [overflow-wrap:anywhere]",
                     isSelf ? "bg-primary" : "bg-background",
                     props.newMinute && "rounded-tr-md",
                     (props.nextNewMinute ?? props.nextNewMinute === undefined) && "rounded-bl-md rounded-br-md ",
                  )}
               >
                  {props.content}
               </div> */}
					{/* {props.content} */}
				</div>
			</div>
			{/* </div> */}
		</li>
	);
});

export default BaseMessage;
