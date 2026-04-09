import UserAvatar from "@components/UserAvatar";
import { MessageContext } from "@contexts/MessageProvider";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useMessageRenderer } from "@hooks/useMessageRenderer";
import { clamp, hasFlag, MessageFlags, MessageType, type Snowflake } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import moment from "moment";
import { useContext, useLayoutEffect, useMemo, useState } from "react";

import type { AppMessage } from "@/types";

import AttachmentUploadProgress from "./AttachmentUploadProgress";

export default function DefaultMessage() {
   const { user } = useThisUser();
   const context = useContext(MessageContext);
   const { open } = useContextMenu("message");
   const { updateModals } = useModals();

   const formattedFullTime = useMemo(() => moment(context.message?.timestamp).format("DD.MM.YYYY HH:mm"), [context.message]);
   const formattedTime = useMemo(() => moment(context.message?.timestamp).format("HH:mm"), [context.message]);

   const author = useUser(context.message.authorId);
   const isSelf = author?.id === user?.id;

   const referencedMessage =
      (context.message.isPreview && context.message.referencedMessage) || (!context.message.isPreview && context.message.type === MessageType.REPLY)
         ? context.message.referencedMessage
         : undefined;

   const isLastAction = context.lastMessage?.isActionType === true;
   const isSeparate = context.message.hasNewAuthor || context.message.hasNewMinute || context.message.hasNewDate || context.message.isReplyType;
   const isEditing = context.message.isEditing;
   const isReplying = context.message.isReplying;
   const isJumpHighlighted = context.message.isJumpHighlighted;
   const isEdited = !context.message.isPreview && context.message.editedTimestamp !== null;
   const isPreview = context.message.isPreview;
   const error = isPreview ? context.message.error : undefined;
   const isNextPreview = context.nextMessage?.isPreview;
   const isNextSeparate =
      !context.nextMessage ||
      context.nextMessage?.hasNewAuthor ||
      context.nextMessage?.hasNewMinute ||
      context.nextMessage?.hasNewDate ||
      context.nextMessage?.isActionType ||
      context.nextMessage?.isReplyType;

   const isNewDate = context.message.hasNewDate || !context.lastMessage || context.message.hasNewDate;

   const isUnread = context.message.isUnread;

   const [widths, setWidths] = useState<{ width: number; lastWidth: number; nextWidth: number }>({
      width: 0,
      lastWidth: 0,
      nextWidth: 0,
   });

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
            "group relative flex flex-col items-start p-2 pl-4 transition-colors duration-150",
            isEditing || isReplying || isJumpHighlighted ? (isEditing ? "bg-positive-800/30" : "bg-primary-800/30") : "hover:bg-surface-alt",
            isJumpHighlighted && "animate-pulse",
            (isSeparate || isLastAction) && "rounded-tr-lg",
            isNextSeparate && "rounded-br-lg",
            !isSeparate && !isLastAction && "py-0",
            !isNextSeparate && "pb-0",
            isSeparate && !isNewDate && !isUnread && "mt-1.5",
         )}
      >
         <div
            className={clsx(
               "absolute inset-y-0 left-0 h-full transition-[colors_width]",
               isEditing || isReplying || isJumpHighlighted ? "w-1" : "w-0",
               isEditing ? "bg-positive-400" : isReplying || isJumpHighlighted ? "bg-primary-400" : undefined,
            )}
         ></div>
         {error}
         {referencedMessage && <ReplyRenderer referencedMessage={referencedMessage} onClick={context.onReferencedMessageClick} />}
         {(isSeparate || isLastAction) && (
            <div className="flex items-center gap-x-2">
               <button
                  type="button"
                  className="cursor-pointer rounded-full"
                  onClick={() => updateModals({ userProfile: { isOpen: true, userId: context.message.authorId } })}
               >
                  <UserAvatar userId={context.message.authorId} avatarHash={author?.avatar} size={1.75} />
               </button>
               <button
                  type="button"
                  className="text-text cursor-pointer text-sm hover:underline"
                  onClick={() => updateModals({ userProfile: { isOpen: true, userId: context.message.authorId } })}
               >
                  {isSelf ? "You" : author?.displayName}
               </button>
               {!context.message.isPreview && context.message.flags && hasFlag(context.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
                  <IconMingcuteNotificationOffFill className="text-text size-4" />
               ) : null}
               <div className="text-text/50 text-xs">{formattedFullTime}</div>
            </div>
         )}
         <div className={clsx("flex items-start font-light text-white", (isSeparate || isLastAction) && "mt-2")}>
            <DefaultRenderer
               isNextSeparate={isNextSeparate}
               isSelf={isSelf}
               isSeparate={isSeparate}
               isUnread={isUnread}
               isLastAction={isLastAction}
               isPreview={isPreview}
               isNextPreview={isNextPreview}
               widths={widths}
            />
            <div className="mt-2.5 ml-2.5 flex h-full shrink-0 items-center justify-center gap-x-2 select-none">
               {isEditing ? (
                  <IconMingcuteEdit2Fill className="text-positive-100 size-4 shrink-0" />
               ) : isReplying ? (
                  <IconMingcuteCornerUpLeftFill className="text-primary-400 size-4 shrink-0" />
               ) : null}
               {/* {(isEditing || isReplying) && (
                  <div className={clsx("")}>
                  </div>
               )} */}
               {isEdited && <div className="text-xs text-white/50">(edited)</div>}
               {!isSeparate && !isLastAction && <div className="text-text/50 text-xs opacity-0 group-hover:opacity-100">{formattedTime}</div>}
            </div>
         </div>
      </div>
   );
}

function ReplyRenderer(props: { referencedMessage: AppMessage; onClick: (messageId: Snowflake) => void }) {
   const message = useMemo<AppMessage>(
      () => ({
         ...props.referencedMessage,
         content: props.referencedMessage.content.replaceAll("\n", " ").replaceAll(/```(?:\S*)?/g, "`"),
      }),
      [props.referencedMessage],
   );

   const { children } = useMessageRenderer(message, ["attachment", "code", "embed"], true);
   const user = useUser(props.referencedMessage.authorId);

   if (props.referencedMessage.isPreview) {
      return;
   }

   return (
      <div
         className="group/reply flex w-full cursor-pointer items-center gap-x-1 pl-2 select-none"
         onClick={() => props.onClick(props.referencedMessage.id)}
      >
         <IconMingcuteCornerUpRightLine className="size-7 shrink-0 text-white/50 group-hover/reply:text-white" />
         <div className="mb-2 flex items-center gap-x-2 overflow-hidden">
            <div className="flex items-center gap-x-1">
               <UserAvatar userId={user.id} avatarHash={user.avatar} size={1.25} hideStatus />
               <div className="text-text/80 text-xs">{user.displayName}</div>
            </div>
            {props.referencedMessage.content && <div className="overflow-hidden text-sm text-white">{children}</div>}
            {(props.referencedMessage.attachments.length !== 0 || props.referencedMessage.embeds.length !== 0) && (
               <IconMingcutePhotoAlbum2Fill className="text-text" />
            )}
         </div>
      </div>
   );
}

function DefaultRenderer(props: {
   widths: { width: number; lastWidth: number; nextWidth: number };
   isSelf: boolean;
   isUnread: boolean;
   isSeparate: boolean;
   isNextPreview?: boolean;
   isNextSeparate: boolean;
   isLastAction: boolean;
   isPreview: boolean;
}) {
   const { messageUploadProgresses } = useChannelStore();
   const context = useContext(MessageContext);
   const progress = useMemo(() => messageUploadProgresses.find((x) => x.messageId === context.message.id), [messageUploadProgresses]);
   const { children } = useMessageRenderer(context.message);

   return (
      <div
         className={clsx(
            "relative px-2.5 py-1.5 font-normal wrap-anywhere whitespace-break-spaces text-white transition-[background-color] group-hover:shadow-sm",
            props.isPreview ? "bg-surface text-white/50" : props.isSelf ? "bg-primary-800" : "bg-surface",
            props.isUnread && !props.isSeparate && "rounded-t-none!",
            (props.isSeparate || props.isLastAction) && "rounded-t-xl!",
            props.isNextSeparate && "rounded-b-xl!",
         )}
         style={{
            borderBottomRightRadius: `${clamp((props.widths.width - props.widths.nextWidth) / 2, 0, 12)}px`,
            borderTopRightRadius: `${clamp((props.widths.width - props.widths.lastWidth) / 2, 0, 12)}px`,
         }}
      >
         {!props.isSeparate && props.widths.lastWidth > props.widths.width && (
            <div className="absolute top-0 -right-10 h-10 w-10 overflow-hidden">
               <div
                  className={clsx(
                     "h-full w-full overflow-hidden transition-[border-radius]",
                     props.isSelf ? "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-primary-800))]" : "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-surface))]",
                  )}
                  style={{
                     borderTopLeftRadius: props.isPreview ? "0px" : `${clamp((props.widths.lastWidth - props.widths.width) / 2, 0, 12)}px`,
                  }}
               />
            </div>
         )}
         {!props.isNextSeparate && props.widths.nextWidth > props.widths.width && (
            <div className="absolute -right-10 bottom-0 h-10 w-10 overflow-hidden">
               <div
                  className={clsx(
                     "h-full w-full overflow-hidden transition-[border-radius]",
                     props.isSelf ? "[box-shadow:0_20px_0_0_rgb(var(--tcolor-primary-800))]" : "[box-shadow:0_20px_0_0_rgb(var(--tcolor-surface))]",
                  )}
                  style={{
                     borderBottomLeftRadius: props.isNextPreview ? "0px" : `${clamp((props.widths.nextWidth - props.widths.width) / 2, 0, 12)}px`,
                  }}
               />
            </div>
         )}
         <div id={`${context.message.id}_inner`}>
            {progress !== undefined && props.isPreview ? <AttachmentUploadProgress progress={progress} /> : children}
         </div>
      </div>
   );
}
