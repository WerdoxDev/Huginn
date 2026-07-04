import Tooltip from "@components/tooltip/Tooltip";
import UserAvatar from "@components/UserAvatar";
import { MessageContext } from "@contexts/MessageProvider";
import { useUser } from "@hooks/api-hooks/userHooks";
import { useMessageRenderer } from "@hooks/useMessageRenderer";
import { useMessageWidths } from "@hooks/useMessageWidths";
import { clamp, hasFlag, MessageFlags, MessageType, type Snowflake } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { usePopover } from "@stores/popoverStore";
import { useThisUser } from "@stores/userStore";
import clsx from "clsx";
import moment from "moment";
import { useContext, useEffect, useMemo, useState, type RefObject } from "react";

import type { AppMessage, MessageErrorType, ProcessedAppMessage } from "@/types";

import AttachmentUploadProgress from "./AttachmentUploadProgress";
import { MessageActions } from "./MessageActions";
import MessageReactions from "./MessageReactions";

export default function DefaultMessage() {
   const { user } = useThisUser();
   const context = useContext(MessageContext);
   const { open, context: contextMenu } = useContextMenu("message");
   const { popover } = usePopover("emoji_picker");
   const { updateModals } = useModals();
   const { rootRef, extrasRef, reactionsRef, widths } = useMessageWidths({
      idPrefix: context.options?.idPrefix,
      message: context.message,
      lastMessage: context.lastMessage,
      nextMessage: context.nextMessage,
   });

   const [isHovering, setIsHovering] = useState(false);

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
   const nextError = context.nextMessage?.isPreview ? context.nextMessage.error : undefined;
   const isNextPreview = context.nextMessage?.isPreview;
   const isNextSeparate =
      !context.nextMessage ||
      context.nextMessage?.hasNewAuthor ||
      context.nextMessage?.hasNewMinute ||
      context.nextMessage?.hasNewDate ||
      context.nextMessage?.isActionType ||
      context.nextMessage?.isReplyType;
   const hasReactions = !context.message.isPreview && context.message.reactions !== undefined && context.message.reactions.length > 0;
   const hasLastReactions =
      !context.lastMessage?.isPreview && context.lastMessage?.reactions !== undefined && context.lastMessage?.reactions.length > 0;

   const isNewDate = context.message.hasNewDate || !context.lastMessage || context.message.hasNewDate;
   const isUnread = context.message.isUnread;

   const hasContext =
      (contextMenu?.isOpen && contextMenu.contextData?.message.id === context.message.id) ||
      (popover?.isOpen && popover.data?.messageId === context.message.id);

   return (
      <div
         ref={rootRef}
         onMouseEnter={() => setIsHovering(true)}
         onMouseLeave={() => setIsHovering(false)}
         onContextMenu={context.options?.disableContextMenu ? undefined : (e) => open({ message: context.message }, e)}
         data-context={hasContext === true ? true : undefined}
         className={clsx(
            "group relative flex flex-col items-start p-2 pr-0 pl-4 transition-colors duration-150",
            !context.options?.hideBackground &&
               (isEditing || isReplying || isJumpHighlighted
                  ? isEditing
                     ? "bg-positive-900/30"
                     : "bg-primary-800/30"
                  : "hover:bg-surface-alt active:bg-surface-alt data-context:bg-surface-alt"),
            isJumpHighlighted && "animate-pulse",
            (isSeparate || isLastAction) && "rounded-tr-lg",
            isNextSeparate && "rounded-br-lg",
            !isSeparate && !isLastAction && "py-0",
            hasReactions && "pb-2",
            !isNextSeparate && "pb-0",
            isSeparate && !isNewDate && !isUnread && "mt-1.5",
         )}
      >
         {!context.message.isPreview && !context.options?.hideActions && <MessageActions message={context.message} />}
         <div
            className={clsx(
               "absolute inset-y-0 left-0 h-full transition-[width]",
               isEditing || isReplying || isJumpHighlighted ? "w-1" : "w-0",
               isEditing ? "bg-positive-500" : isReplying || isJumpHighlighted ? "bg-primary-400" : undefined,
            )}
         ></div>
         {referencedMessage !== undefined && <ReplyRenderer referencedMessage={referencedMessage} onClick={context.onReferencedMessageClick} />}
         {(isSeparate || isLastAction) && (
            <div className="flex items-center gap-x-2">
               <button
                  type="button"
                  className="cursor-pointer rounded-full"
                  onClick={() => updateModals({ userProfile: { isOpen: true, userId: context.message.authorId } })}
               >
                  <UserAvatar userId={context.message.authorId} avatarHash={author?.avatar} size={1.75} hovered={isHovering} />
               </button>
               <button
                  type="button"
                  className="text-text cursor-pointer text-sm hover:underline"
                  onClick={() => updateModals({ userProfile: { isOpen: true, userId: context.message.authorId } })}
               >
                  {author?.displayName}
               </button>
               {!context.message.isPreview && context.message.flags && hasFlag(context.message.flags, MessageFlags.SUPPRESS_NOTIFICATIONS) ? (
                  <IconMingcuteNotificationOffFill className="text-text size-4" />
               ) : null}
               <div className="text-text/50 text-xs">{formattedFullTime}</div>
            </div>
         )}
         <div className={clsx("flex w-full items-start font-light text-white", (isSeparate || isLastAction) && "mt-2")}>
            <DefaultRenderer
               isNextSeparate={isNextSeparate}
               isSelf={isSelf}
               isSeparate={isSeparate}
               isUnread={isUnread}
               isLastAction={isLastAction}
               isPreview={isPreview}
               isNextPreview={isNextPreview}
               isEdited={isEdited}
               extrasRef={extrasRef}
               error={error}
               nextError={nextError}
               hasReactions={hasReactions}
               hasLastReactions={hasLastReactions}
               widths={widths}
            />
            {!isSeparate && !isLastAction && (
               <div className="mx-2.5 mt-2.5 flex h-full shrink-0 items-center justify-center gap-x-2 select-none">
                  <div className="text-text/50 text-xs opacity-0 transition-opacity group-hover:opacity-100">{formattedTime}</div>
               </div>
            )}
         </div>
         {!context.message.isPreview && <MessageReactions message={context.message} messageWidth={widths.width} ref={reactionsRef} />}
      </div>
   );
}

function ReplyRenderer(props: { referencedMessage: AppMessage | null; onClick?: (messageId: Snowflake) => void }) {
   if (props.referencedMessage === null) {
      return (
         <div className="flex w-full items-center gap-x-1 pl-2 select-none">
            <IconMingcuteCornerUpRightLine className="size-7 shrink-0 text-white/50" />
            <div className="mb-2 text-xs text-white/50 italic">Original message was deleted</div>
         </div>
      );
   }

   if (props.referencedMessage.isPreview) {
      return null;
   }

   return <ResolvedReplyRenderer referencedMessage={props.referencedMessage} onClick={props.onClick} />;
}

function ResolvedReplyRenderer(props: { referencedMessage: ProcessedAppMessage; onClick?: (messageId: Snowflake) => void }) {
   const message = useMemo<ProcessedAppMessage>(
      () => ({
         ...props.referencedMessage,
         content: props.referencedMessage.content.replaceAll("\n", " ").replaceAll(/```(?:\S*)?/g, "`"),
      }),
      [props.referencedMessage],
   );

   const hasAttachmentsOrEmbeds =
      ("attachments" in props.referencedMessage && props.referencedMessage.attachments.length !== 0) ||
      ("embeds" in props.referencedMessage && props.referencedMessage.embeds.length !== 0);

   const { children } = useMessageRenderer(message, ["attachment", "code", "embed"], true, true);
   const user = useUser(props.referencedMessage.authorId);

   function handleClick() {
      props.onClick?.(props.referencedMessage.id);
   }

   if (!user) return;

   return (
      <div className="group/reply flex w-full cursor-pointer items-center gap-x-1 pr-2 pl-2 select-none" onClick={handleClick}>
         <IconMingcuteCornerUpRightLine className="size-7 shrink-0 text-white/50 transition-colors group-hover/reply:text-white" />
         <div className="mb-2 flex items-center gap-x-2 overflow-hidden">
            <div className="flex items-center gap-x-1 text-nowrap">
               <UserAvatar userId={user.id} avatarHash={user.avatar} size={1.25} hideStatus />
               <div className="text-text/80 text-xs">{user.displayName}</div>
            </div>
            {props.referencedMessage.content && <div className="overflow-hidden text-sm text-white">{children}</div>}
            {hasAttachmentsOrEmbeds && <IconMingcutePhotoAlbum2Fill className="text-text shrink-0" />}
         </div>
      </div>
   );
}

function DefaultRenderer(props: {
   widths: { width: number; lastWidth: number; nextWidth: number; reactionsWidth: number };
   isSelf: boolean;
   isUnread: boolean;
   isSeparate: boolean;
   isNextPreview?: boolean;
   isNextSeparate: boolean;
   isLastAction: boolean;
   isPreview: boolean;
   isEdited?: boolean;
   hasReactions: boolean;
   hasLastReactions?: boolean;
   error?: MessageErrorType;
   nextError?: MessageErrorType;
   extrasRef: RefObject<HTMLDivElement | null>;
}) {
   const { messageUploadProgresses } = useChannelStore();
   const context = useContext(MessageContext);
   const progress = useMemo(() => messageUploadProgresses.find((x) => x.messageId === context.message.id), [messageUploadProgresses]);
   const { children } = useMessageRenderer(context.message);

   function handleRetry() {
      if (!context.message.isPreview) return;
      context.onRetrySendMessage?.(context.message);
   }

   return (
      <div
         className={clsx(
            "group relative w-full px-2.5 py-1.5 font-normal wrap-anywhere whitespace-break-spaces text-white",
            props.isPreview && props.error === undefined && "text-white/50",
         )}
      >
         <div className="absolute inset-y-0 left-0 flex">
            <div style={{ width: `${props.widths.width + 20}px` }} className="shrink-0">
               <div
                  className={clsx(
                     "pointer-events-none z-0 h-full w-full transition-[shadow] group-hover:shadow-sm",
                     props.error === undefined && props.isPreview
                        ? "bg-surface"
                        : props.error !== undefined
                          ? "bg-negative-700"
                          : props.isSelf
                            ? "bg-primary-800"
                            : "bg-surface",
                     props.isUnread && !props.isSeparate && "rounded-t-none!",
                     (props.isSeparate || props.isLastAction || props.hasLastReactions) && "rounded-t-xl!",
                     props.isNextSeparate && !props.hasReactions && "rounded-b-xl!",
                  )}
                  style={{
                     borderBottomRightRadius: props.hasReactions
                        ? clamp((props.widths.width + 20 - props.widths.reactionsWidth) / 2, 0, 12)
                        : clamp((props.widths.width - props.widths.nextWidth) / 2, 0, 12),
                     borderTopRightRadius: `${clamp((props.widths.width - props.widths.lastWidth) / 2, 0, 12)}px`,
                  }}
               >
                  {!props.isSeparate && props.widths.lastWidth > props.widths.width && !props.hasLastReactions && (
                     <div className="absolute top-0 h-10 w-10 overflow-hidden" style={{ left: props.widths.width + 20 }}>
                        <div
                           className={clsx(
                              "h-full w-full overflow-hidden transition-all duration-1000",
                              props.error !== undefined
                                 ? "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-negative-700))]"
                                 : props.isSelf
                                   ? "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-primary-800))]"
                                   : "[box-shadow:0_-20px_0_0_rgb(var(--tcolor-surface))]",
                           )}
                           style={{
                              borderTopLeftRadius:
                                 props.isPreview && props.error === undefined
                                    ? "0px"
                                    : `${clamp((props.widths.lastWidth - props.widths.width) / 2, 0, 12)}px`,
                           }}
                        />
                     </div>
                  )}
               </div>
               {!props.isNextSeparate && props.widths.nextWidth > props.widths.width && !props.hasReactions && (
                  <div className="absolute bottom-0 h-10 w-10 overflow-hidden" style={{ left: props.widths.width + 20 }}>
                     <div
                        className={clsx(
                           "h-full w-full overflow-hidden transition-all duration-1000",
                           props.error !== undefined
                              ? "[box-shadow:0_20px_0_0_rgb(var(--tcolor-negative-700))]"
                              : props.isSelf
                                ? "[box-shadow:0_20px_0_0_rgb(var(--tcolor-primary-800))]"
                                : "[box-shadow:0_20px_0_0_rgb(var(--tcolor-surface))]",
                        )}
                        style={{
                           borderBottomLeftRadius:
                              props.isNextPreview && props.nextError === undefined
                                 ? "0px"
                                 : `${clamp((props.widths.nextWidth - props.widths.width) / 2, 0, 12)}px`,
                        }}
                     />
                  </div>
               )}
            </div>
            {(context.message.isEditing || context.message.isReplying || props.isEdited || props.error !== undefined) && (
               <div className={clsx("z-20 flex shrink-0 items-center gap-x-1", props.isSeparate ? "px-2" : "pl-2")} ref={props.extrasRef}>
                  {props.error !== undefined && (
                     <div className="flex h-full items-center justify-center">
                        <Tooltip>
                           <Tooltip.Trigger
                              className="bg-caution-500 hover:bg-caution-700 active:bg-caution-700 rounded-md p-1 transition-colors"
                              onClick={handleRetry}
                           >
                              <IconMingcuteRefreshAnticlockwise1Line className="size-5" />
                           </Tooltip.Trigger>
                           <Tooltip.Content>Retry</Tooltip.Content>
                        </Tooltip>
                     </div>
                  )}

                  {(context.message.isEditing || context.message.isReplying || props.isEdited) && (
                     <div className="flex shrink-0 items-center gap-x-1">
                        {context.message.isEditing ? (
                           <IconMingcuteEdit2Fill className="text-positive-100 size-4" />
                        ) : context.message.isReplying ? (
                           <IconMingcuteCornerUpLeftFill className="text-primary-400 size-4" />
                        ) : null}
                        {props.isEdited && <div className="text-xs text-white/50">(edited)</div>}
                     </div>
                  )}
               </div>
            )}
         </div>

         <div
            id={`${(context.options?.idPrefix ?? "") + context.message.id}_inner`}
            className="relative z-10"
            style={{ width: `calc(100% - ${props.extrasRef.current?.offsetWidth ?? 10}px)` }}
         >
            {progress !== undefined && props.isPreview ? <AttachmentUploadProgress progress={progress} /> : children}
         </div>
      </div>
   );
}
