import MessageRenderer from "@components/message/MessageRenderer";
import type { Snowflake } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import { createContext } from "react";
import type { MessageRendererProps, ProcessedMessage } from "@/types";

export const MessageContext = createContext<{
	message: ProcessedMessage;
	nextMessage?: ProcessedMessage;
	lastMessage?: ProcessedMessage;
	onVisibilityChanged: (messageId: Snowflake, visible: boolean) => void;
	ref: React.RefObject<HTMLLIElement | null>;
}>(undefined!);

export function MessageProvider(props: MessageRendererProps) {
	return (
		<MessageContext.Provider value={{ ...props }}>
			{props.message.isUnread && !props.message.hasNewDate && (
				<li
					className={clsx(
						"bg-negative-300 pointer-events-none relative ml-2 mr-10 flex h-px shrink-0 items-center justify-center",
						props.lastMessage ? "my-1" : "mb-1",
					)}
				>
					<div className="bg-negative-300 absolute right-0 z-10 -mr-10 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold uppercase text-white">
						new
					</div>
				</li>
			)}
			{props.message.hasNewDate && (
				<li
					className={clsx(
						"relative mx-2 flex h-0 shrink-0 items-center justify-center border-b border-t text-center text-xs font-medium",
						props.lastMessage ? "my-5" : "mb-5 mt-2",
						props.message.isUnread ? "border-negative-300 text-negative-100" : "border-text/25 text-text/70",
					)}
				>
					<span className={clsx("bg-surface-deep px-2", props.message.isUnread && "ml-10")}>
						{moment(props.message.timestamp).format("D MMMM YYYY")}
					</span>
					{props.message.isUnread && (
						<div className="bg-negative-300 absolute -right-2 flex w-10 items-center justify-center rounded-l-md py-1 text-xs font-bold uppercase text-white">
							new
						</div>
					)}
				</li>
			)}
			<MessageRenderer />
		</MessageContext.Provider>
	);
}
