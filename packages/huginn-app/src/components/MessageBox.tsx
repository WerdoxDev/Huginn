import type { Descendant } from "slate";

import { App } from "@capacitor/app";
import { useKeyboard } from "@contexts/KeyboardContext";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useIsMobile } from "@hooks/useIsMobile";
import { useMessageBoxActions } from "@hooks/useMessageBoxActions";
import { useMessageBoxAttachments } from "@hooks/useMessageBoxAttachments";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import { MessageFlags } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Editable, Slate, ReactEditor, type RenderPlaceholderProps } from "slate-react";

import type { AppMessage } from "@/types";

import AttachmentsPreview from "./AttachmentsPreview";
import EmojiPickerButton from "./button/EmojiPickerButton";
import FilePickerButton from "./button/FilePickerButton";
import HuginnButton from "./button/HuginnButton";
import ChannelTypingIndicator from "./channels/ChannelTypingIndicator";
import EmojiPickerPanel from "./channels/EmojiPickerPanel";
import EmojiPickerPopover from "./channels/EmojiPickerPopover";
import FilePickerPanel from "./channels/FilePickerPanel";
import DraggingIndicator from "./DraggingIndicator";
import EditingPreview from "./EditingPreview";
import ReplyingPreview from "./ReplyingPreview";
import Tooltip from "./tooltip/Tooltip";

function Placeholder({ attributes, children }: RenderPlaceholderProps) {
   return (
      <div {...attributes} className="truncate">
         {children}
      </div>
   );
}

export default function MessageBox(props: { messages: AppMessage[] }) {
   const initialValue: Descendant[] = useMemo(
      () => [
         {
            type: "paragraph",
            children: [
               {
                  text: "",
               },
            ],
         },
      ],
      [],
   );

   const containerRef = useRef<HTMLDivElement>(null);
   const currentChannel = useCurrentChannel();
   const huginnWindow = useHuginnWindow();
   const isMobileEnvironment = huginnWindow.environment === "android";
   const isMobile = useIsMobile();
   const { setMessageBoxHeight } = useChannelStore();
   const { decorate, editor, renderElement, renderLeaf, handleEditorOnChange } = usePreviewMessageRenderer();

   const { attachments, dragging, openFileSelector, addAttachments, removeAttachment, clearAttachments, onPaste } = useMessageBoxAttachments();

   const {
      sendMessage,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId,
      resetState,
      insertEmoji,
   } = useMessageBoxActions({ editor, decorate, messages: props.messages, attachments, clearAttachments });

   const { isKeyboardOpen, lastKeyboardHeight } = useKeyboard();
   const [activeMobilePanel, setActiveMobilePanel] = useState<"emoji" | "files" | null>(null);

   const shouldShowMobilePanel = isMobileEnvironment && (activeMobilePanel !== null || isKeyboardOpen);

   // Focus on the message box when we change channel
   useEffect(() => {
      // Clear attachments and reset local state for new channel
      clearAttachments();
      resetState();

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

   useEffect(() => {
      let unlisten: () => void;
      let cancelled = false;

      App.addListener("backButton", () => {
         if (activeMobilePanel) {
            setActiveMobilePanel(null);
         }
      }).then((listener) => {
         if (cancelled) listener.remove();
         unlisten = () => listener.remove();
      });

      return () => {
         cancelled = true;
         unlisten?.();
      };
   }, [activeMobilePanel]);

   function handleMobileEmojiPickerClick() {
      setActiveMobilePanel((prev) => (prev === "emoji" && !isKeyboardOpen ? null : "emoji"));
   }

   function handleMobileFilePickerClick() {
      setActiveMobilePanel((prev) => (prev === "files" && !isKeyboardOpen ? null : "files"));
   }

   const hasAddon = !!(currentEditingMessageId || currentReplyingMessageId || attachments.length);

   return (
      <div className="relative shrink-0">
         <div className="to-surface-deep pointer-events-none absolute inset-x-0 -top-7 right-2.5 z-10 h-7 bg-linear-to-b from-transparent" />

         <ChannelTypingIndicator channelId={channelId!} />
         <div
            className={clsx("bottom-0 z-10 flex flex-col select-text")}
            // style={{ height: shouldShowMobilePanel ? lastKeyboardHeight + (containerRef.current?.clientHeight ?? 0) + 6 : undefined }}
         >
            <DraggingIndicator isDragging={dragging} />
            <div
               className={clsx(
                  "bg-surface-alt border-surface mx-1.5 mb-1.5 shrink-0 overflow-hidden rounded-xl border-2 transition-[border-radius]",
                  hasAddon && "rounded-t-xl",
               )}
               ref={containerRef}
            >
               <EditingPreview onCancel={cancelEditMessage} show={!!currentEditingMessageId} />
               <ReplyingPreview
                  channelId={channelId!}
                  messageId={currentReplyingMessageId}
                  onCancel={cancelReplyMessage}
                  show={!!currentReplyingMessageId}
               />
               <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />
               <div className="flex h-full items-start">
                  {!currentEditingMessageId &&
                     (isMobileEnvironment ? (
                        <FilePickerButton onClick={handleMobileFilePickerClick} />
                     ) : (
                        <Tooltip>
                           <Tooltip.Trigger asChild>
                              <FilePickerButton onClick={openFileSelector} />
                           </Tooltip.Trigger>
                           <Tooltip.Content>Upload Files</Tooltip.Content>
                        </Tooltip>
                     ))}
                  <div className="h-full w-full overflow-hidden">
                     {/* <Slate editor={editor} initialValue={initialValue} onChange={handleEditorOnChange}> */}
                     <Slate editor={editor} initialValue={initialValue} onChange={handleEditorOnChange}>
                        <Editable
                           onPaste={onPaste}
                           placeholder={`Message ${currentChannel?.name}`}
                           className={clsx(
                              "keyboard-no-resize h-full py-3 leading-6 font-light whitespace-break-spaces text-white caret-white outline-hidden",
                              currentEditingMessageId && "pl-3",
                           )}
                           renderLeaf={renderLeaf}
                           renderElement={renderElement}
                           decorate={decorate}
                           onKeyDown={onEditorKeyDown}
                           renderPlaceholder={Placeholder}
                           disableDefaultStyles
                        />
                     </Slate>
                  </div>
                  <div className="ml-2 flex h-8 gap-x-2 p-2">
                     {isMobileEnvironment ? (
                        <EmojiPickerButton onClick={handleMobileEmojiPickerClick} />
                     ) : (
                        <EmojiPickerPopover onEmojiSelect={insertEmoji} />
                     )}
                     <HuginnButton
                        color="primary"
                        className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full!"
                        type="button"
                        onClick={() => sendMessage(MessageFlags.NONE)}
                     >
                        <IconLetsIconsSendHorFill className="text-text size-6" />
                     </HuginnButton>
                  </div>
               </div>
            </div>
            <div className="" style={{ height: shouldShowMobilePanel ? lastKeyboardHeight : undefined }}>
               {activeMobilePanel === "emoji" && <EmojiPickerPanel onEmojiSelect={insertEmoji} />}
               {activeMobilePanel === "files" && <FilePickerPanel attachments={attachments} onAdd={addAttachments} onRemove={removeAttachment} />}
            </div>
         </div>
      </div>
   );
}
