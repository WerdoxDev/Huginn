import type { Descendant } from "slate";

import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { useMessageBoxActions } from "@hooks/useMessageBoxActions";
import { useMessageBoxAttachments } from "@hooks/useMessageBoxAttachments";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import { MessageFlags } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import clsx from "clsx";
import { useEffect, useRef } from "react";
import { Editable, Slate, ReactEditor } from "slate-react";

import type { AppMessage } from "@/types";

import AttachmentsPreview from "./AttachmentsPreview";
import DraggingIndicator from "./DraggingIndicator";
import EditingPreview from "./EditingPreview";
import ReplyingPreview from "./ReplyingPreview";
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

export default function MessageBox(props: { messages: AppMessage[] }) {
   const editorRef = useRef<HTMLDivElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const currentChannel = useCurrentChannel();
   const isMobile = useIsMobile();
   const { setMessageBoxHeight } = useChannelStore();
   const { decorate, editor, renderElement, renderLeaf } = usePreviewMessageRenderer();

   const { attachments, dragging, addFiles, removeAttachment, clearAttachments, onPaste } = useMessageBoxAttachments(editorRef, props.messages);

   const {
      sendMessage,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId,
      resetState,
   } = useMessageBoxActions({ editor, decorate, messages: props.messages, attachments, clearAttachments, editorRef });

   // Focus on the message box when we change channel
   useEffect(() => {
      // Clear attachments and reset local state for new channel
      clearAttachments();
      resetState();
      console.log("RESET");

      if (isMobile || !editor) return;

      requestAnimationFrame(() => {
         if (editor.children.length !== 0) ReactEditor.focus(editor);
      });
   }, [currentChannel?.id, isMobile]);

   // Track message box height for scroll calculations
   useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
         setMessageBoxHeight(entries[0].target.clientHeight);
      });

      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
   }, []);

   const hasAddon = !!(currentEditingMessageId || currentReplyingMessageId || attachments.length);

   return (
      <div className="bottom-0 z-10 flex-col px-1.5 py-1.5 lg:px-5" ref={containerRef}>
         <DraggingIndicator isDragging={dragging} />
         {/* <form className="w-full"> */}
         <div
            className={clsx(
               "border-surface bg-surface-deep overflow-hidden rounded-3xl border-2 transition-[border-radius]",
               hasAddon && "rounded-t-xl",
            )}
         >
            {/* {currentEditingMessageId && <EditingPreview onCancel={cancelEditMessage} />} */}
            <EditingPreview onCancel={cancelEditMessage} show={!!currentEditingMessageId} />
            <ReplyingPreview
               channelId={channelId!}
               messageId={currentReplyingMessageId}
               onCancel={cancelReplyMessage}
               show={!!currentReplyingMessageId}
            />
            <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />
            <div className="flex h-full items-start">
               {!currentEditingMessageId && (
                  <Tooltip>
                     <Tooltip.Trigger
                        onClick={addFiles}
                        type="button"
                        className="bg-surface m-2 mr-2 flex shrink-0 cursor-pointer items-center rounded-full p-1.5 transition-all hover:bg-white/20 enabled:hover:shadow-xl"
                     >
                        <IconMingcuteAddFill name="gravity-ui:plus" className="text-text size-5" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>Upload Files</Tooltip.Content>
                  </Tooltip>
               )}
               <div className="h-full w-full overflow-hidden">
                  <Slate editor={editor} initialValue={initialValue}>
                     <Editable
                        onPaste={onPaste}
                        ref={editorRef}
                        placeholder={`Message ${currentChannel?.name}`}
                        className={clsx(
                           "h-full py-3 leading-6 font-light whitespace-break-spaces text-white caret-white outline-hidden",
                           currentEditingMessageId && "pl-3",
                        )}
                        renderLeaf={renderLeaf}
                        renderElement={renderElement}
                        decorate={decorate}
                        onKeyDown={onEditorKeyDown}
                        renderPlaceholder={({ children, attributes }) => (
                           <div {...attributes} className="truncate">
                              {children}
                           </div>
                        )}
                        disableDefaultStyles
                     />
                  </Slate>
               </div>
               <div className="ml-2 flex h-8 gap-x-2 p-2">
                  <div className="bg-surface h-8 w-8 rounded-full" />
                  <div className="bg-surface h-8 w-8 rounded-full" />
                  <button className="bg-primary-700 h-8 w-8 rounded-full p-0.5" type="button" onClick={() => sendMessage(MessageFlags.NONE)}>
                     <IconLetsIconsSendHorFill className="text-text size-full" />
                  </button>
               </div>
            </div>
         </div>
         {/* </form> */}
      </div>
   );
}
