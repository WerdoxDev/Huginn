import UserAvatar from "@components/UserAvatar";
import { MessageContext } from "@contexts/messageProvider";
import { useUser } from "@hooks/api-hooks/userHooks";
import { clamp, hasFlag, MessageFlags } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import moment from "moment";
import { useContext, useLayoutEffect, useMemo, useState } from "react";
import { type Descendant } from "slate";
import { Editable, ReactEditor, type RenderElementProps, type RenderLeafProps, Slate } from "slate-react";
import AttachmentUploadProgress from "./AttachmentUploadProgress";
import { useContextMenu } from "@stores/contextMenuStore";
import { useMessageRenderer } from "@hooks/useMessageRenderer";
import type { UploadProgress } from "@/types";

export default function DefaultMessage() {
   const { user } = useThisUser();
   const context = useContext(MessageContext);
   const { open } = useContextMenu("message");
   const { editor, initialValue, renderElement, renderLeaf } = useMessageRenderer(context.message);

   const formattedFullTime = useMemo(() => moment(context.message?.timestamp).format("DD.MM.YYYY HH:mm"), [context.message]);
   const formattedTime = useMemo(() => moment(context.message?.timestamp).format("HH:mm"), [context.message]);

   const author = useUser(context.message.authorId);
   const isSelf = useMemo(() => author?.id === user?.id, [author]);

   const isLastExotic = useMemo(() => context.lastMessage?.isExoticType === true, [context.lastMessage]);
   const isSeparate = useMemo(() => context.message.hasNewAuthor || context.message.hasNewMinute || context.message.hasNewDate, [context.message]);
   const isEditing = useMemo(() => context.message.isEditing, [context.message]);
   const isEdited = useMemo(() => !context.message.isPreview && context.message.editedTimestamp !== null, [context.message]);
   const isPreview = useMemo(() => context.message.isPreview, [context.message]);
   const isNextPreview = useMemo(() => context.nextMessage?.isPreview, [context.nextMessage]);
   const isNextSeparate = useMemo(
      () => context.nextMessage?.hasNewAuthor || context.nextMessage?.hasNewMinute || !context.nextMessage || context.nextMessage.isExoticType,
      [context.nextMessage],
   );

   const isNewDate = useMemo(
      () => context.message.hasNewDate || !context.lastMessage || context.message.hasNewDate,
      [context.message, context.lastMessage],
   );

   const isUnread = useMemo(() => context.message.isUnread, [context.message]);

   const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number }>({ width: 0, lastWidth: 0, nextWidth: 0 });

   useLayoutEffect(() => {
      const width = document.getElementById(`${context.message.id}_inner`)?.clientWidth || 0;
      const lastWidth = document.getElementById(`${context.lastMessage?.id}_inner`)?.clientWidth || 0;
      const nextWidth = document.getElementById(`${context.nextMessage?.id}_inner`)?.clientWidth || 0;

      setWidths({ width, lastWidth, nextWidth });
   }, [context.message, context.lastMessage, context.nextMessage]);

   return (
      <div
         onContextMenu={(e) => open({ message: context.message }, e)}
         className={clsx(
            "group flex flex-col items-start gap-y-2 p-2 pl-4",
            isEditing ? "bg-primary-900/50" : "hover:bg-surface-alt",
            (isSeparate || isLastExotic) && "rounded-tr-lg",
            isNextSeparate && "rounded-br-lg",
            !isSeparate && !isLastExotic && "py-0",
            !isNextSeparate && "pb-0",
            isSeparate && !isNewDate && !isUnread && "mt-1.5",
         )}
      >
         {(isSeparate || isLastExotic) && (
            <div className="flex items-center gap-x-2">
               <UserAvatar userId={context.message.authorId} avatarHash={author?.avatar} statusSize="0.5rem" size="1.75rem" />
               <div className="text-text text-sm">{isSelf ? "You" : (author?.displayName ?? author?.username)}</div>
               {!context.message.isPreview && context.message.flags && hasFlag(context.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
                  <IconMingcuteNotificationOffFill className="text-text size-4" />
               ) : null}
               <div className="text-text/50 text-xs">{formattedFullTime}</div>
            </div>
         )}
         <div className="flex items-start font-light text-white">
            <SlateRenderer
               initialValue={initialValue}
               editor={editor}
               isNextSeparate={isNextSeparate}
               isSelf={isSelf}
               isSeparate={isSeparate}
               isUnread={isUnread}
               isLastExotic={isLastExotic}
               isPreview={isPreview}
               isNextPreview={isNextPreview}
               renderElement={renderElement}
               renderLeaf={renderLeaf}
               widths={widths}
            />
            <div className="ml-2.5 mt-2.5 flex h-full shrink-0 select-none items-center justify-center gap-x-2">
               {isEditing && <div className="text-positive-100 text-xs font-semibold uppercase">editing</div>}
               {isEdited && <div className="text-xs text-white/50">(edited)</div>}
               {!isSeparate && !isLastExotic && <div className="text-text/50 text-xs opacity-0 group-hover:opacity-100">{formattedTime}</div>}
            </div>
         </div>
      </div>
   );
}

function SlateRenderer(props: {
   editor: ReactEditor;
   initialValue: Descendant[];
   renderLeaf(props: RenderLeafProps): React.JSX.Element;
   renderElement(props: RenderElementProps): React.JSX.Element;
   widths: { width: number; lastWidth: number; nextWidth: number };
   isSelf: boolean;
   isUnread: boolean;
   isSeparate: boolean;
   isNextPreview?: boolean;
   isNextSeparate: boolean;
   isLastExotic: boolean;
   isPreview: boolean;
}) {
   const { messageUploadProgresses } = useChannelStore();
   const context = useContext(MessageContext);
   const progress = useMemo(() => messageUploadProgresses.find((x) => x.messageId === context.message.id), [messageUploadProgresses]);
   // const progress: UploadProgress = { filenames: ["asd"], messageId: "asd", percentage: 0, total: 1000 };

   return (
      <div
         className={clsx(
            "wrap-anywhere relative whitespace-break-spaces px-2.5 py-1.5 font-normal text-white group-hover:shadow-sm",
            context.message.isPreview && "bg-primary-900 text-white/50",
            props.isSelf && !context.message.isPreview ? "bg-primary-800" : "bg-surface",
            props.isUnread && !props.isSeparate && "!rounded-t-none",
            (props.isSeparate || props.isLastExotic) && "!rounded-t-xl",
            props.isNextSeparate && "!rounded-b-xl",
         )}
         style={{
            borderBottomRightRadius: `${clamp((props.widths.width - props.widths.nextWidth) / 2, 0, 12)}px`,
            borderTopRightRadius: `${clamp((props.widths.width - props.widths.lastWidth) / 2, 0, 12)}px`,
         }}
      >
         {!props.isPreview && !props.isSeparate && props.widths.lastWidth > props.widths.width && (
            <div className="absolute -right-10 top-0 h-10 w-10 overflow-hidden">
               <div
                  className={clsx(
                     "h-full w-full overflow-hidden",
                     props.isSelf ? "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-primary-800))]" : "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-surface))]",
                  )}
                  style={{
                     borderTopLeftRadius: `${clamp((props.widths.lastWidth - props.widths.width) / 2, 0, 12)}px`,
                  }}
               />
            </div>
         )}
         {props.isNextPreview === false && !props.isNextSeparate && props.widths.nextWidth > props.widths.width && (
            <div className="absolute -right-10 bottom-0 h-10 w-10 overflow-hidden">
               <div
                  className={clsx(
                     "h-full w-full overflow-hidden",
                     props.isSelf ? "[box-shadow:0_20px_0_0_rgb(var(--tcolor-primary-800))]" : "[box-shadow:0_20px_0_0_rgb(var(--tcolor-surface))]",
                  )}
                  style={{
                     borderBottomLeftRadius: `${clamp((props.widths.nextWidth - props.widths.width) / 2, 0, 12)}px`,
                  }}
               />
            </div>
         )}
         {progress !== undefined ? (
            <AttachmentUploadProgress progress={progress} />
         ) : (
            <Slate
               editor={props.editor}
               initialValue={props.initialValue}
               key={!context.message.isPreview ? (context.message.editedTimestamp as string) : context.message.timestamp}
            >
               <Editable
                  id={`${context.message.id}_inner`}
                  readOnly
                  renderLeaf={props.renderLeaf}
                  renderElement={props.renderElement}
                  disableDefaultStyles
               />
            </Slate>
         )}
      </div>
   );
}
