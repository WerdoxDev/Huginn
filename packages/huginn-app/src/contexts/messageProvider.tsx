import MessageRenderer from "@components/message/MessageRenderer";
import type { Snowflake } from "@huginn/shared";
import clsx from "clsx";
import moment from "moment";
import { createContext } from "react";
import type { MessageRendererProps, MessageRenderInfo } from "@/types";

export const MessageContext = createContext<{
	renderInfo: MessageRenderInfo;
	nextRenderInfo?: MessageRenderInfo;
	lastRenderInfo?: MessageRenderInfo;
	onVisibilityChanged: (messageId: Snowflake, visible: boolean) => void;
	ref: React.RefObject<HTMLLIElement | null>;
}>(
	// biome-ignore lint/style/noNonNullAssertion: The initialization must be with undefined
	undefined!,
);

export function MessageProvider(props: MessageRendererProps) {
	return (
		<MessageContext.Provider value={{ ...props }}>
			{props.renderInfo.unread && !props.renderInfo.newDate && (
				<li
					className={clsx(
						"pointer-events-none relative mr-10 ml-2 flex h-px shrink-0 items-center justify-center bg-negative-300",
						props.lastRenderInfo ? "my-1" : "mb-1",
					)}
				>
					<div className="-mr-10 absolute right-0 z-10 flex w-10 items-center justify-center rounded-l-md bg-negative-300 py-1 font-bold text-white text-xs uppercase">
						new
					</div>
				</li>
			)}
			{!props.renderInfo.message.preview && props.renderInfo.newDate && (
				<li
					className={clsx(
						"relative flex h-0 shrink-0 items-center justify-center border-t text-center font-semibold text-xs",
						props.lastRenderInfo ? "my-5" : "mt-2 mb-5",
						props.renderInfo.unread ? "mr-10 ml-2 border-t-negative-300 text-negative-100" : "mx-2 border-t-text/25 text-text/70",
					)}
				>
					<span className={clsx("bg-surface-deep px-2", props.renderInfo.unread && "ml-10")}>
						{moment(props.renderInfo.message.timestamp).format("DD. MMMM YYYY")}
					</span>
					{props.renderInfo.unread && (
						<div className="-mr-8 absolute right-0 flex w-10 items-center justify-center rounded-l-md bg-negative-300 py-1 font-bold text-white text-xs uppercase">
							new
						</div>
					)}
				</li>
			)}
			<MessageRenderer />
		</MessageContext.Provider>
	);
}
