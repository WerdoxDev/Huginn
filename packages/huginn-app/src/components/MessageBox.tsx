import type { Descendant } from "slate";

import { useInset } from "@contexts/InsetContext";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useBackHandler } from "@hooks/useBackHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { useMessageBoxActions } from "@hooks/useMessageBoxActions";
import { useMessageBoxAttachments } from "@hooks/useMessageBoxAttachments";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import { MessageFlags } from "@huginn/shared";
import { useChannelStore } from "@stores/channelStore";
import { usePopover } from "@stores/popoverStore";
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
import FilePickerDrawer from "./channels/FilePickerDrawer";
import DraggingIndicator from "./DraggingIndicator";
import EditingPreview from "./EditingPreview";
import EmojiPickerRawPanel from "./popover/EmojiPickerRawPanel";
// import EmojiPickerPanel from "./popover/EmojiPickerPanel";
// import EmojiPickerPopover from "./popover/EmojiPickerPopover";
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
   const editorRef = useRef<HTMLDivElement | null>(null);

   const { attachments, dragging, openFileSelector, addAttachments, removeAttachment, clearAttachments, onPaste } = useMessageBoxAttachments();

   const {
      submitMessage,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId,
      resetState,
      insertEmoji,
   } = useMessageBoxActions({ editor, decorate, messages: props.messages, attachments, clearAttachments });

   const { toggle: toggleEmojiPicker, popover: emojiPickerPopover } = usePopover("emoji_picker");

   const { isKeyboardOpen, lastKeyboardHeight, focusedElementRef } = useInset();
   const [activeMobilePanel, setActiveMobilePanel] = useState<"emoji" | "files" | null>(null);

   const shouldShowMobilePanel = isMobileEnvironment && (activeMobilePanel !== null || (isKeyboardOpen && ReactEditor.isFocused(editor)));
   const isKeyboardOpenOnEditor = isKeyboardOpen && focusedElementRef?.current === editorRef.current;

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
         requestAnimationFrame(() => {
            setMessageBoxHeight(entries[0].target.clientHeight);
         });
      });

      resizeObserver.observe(containerRef.current);

      return () => resizeObserver.disconnect();
   }, []);

   // don't close the keyboard when clicking outside the keyboard (except for actual buttons and focusable things)
   useEffect(() => {
      const controller = new AbortController();
      document.addEventListener(
         "focusout",
         (e) => {
            if (
               // e.target === editorRef.current &&
               isKeyboardOpen &&
               (e.relatedTarget === null ||
                  (e.relatedTarget as HTMLElement).closest("[data-keyboard-no-close]") ||
                  (e.relatedTarget as HTMLElement)?.hasAttribute("data-keyboard-no-close"))
            ) {
               ReactEditor.focus(editor);
               e.preventDefault();
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, [isKeyboardOpen]);

   useBackHandler("message-box", 100, () => {
      if (isKeyboardOpen || activeMobilePanel) {
         setActiveMobilePanel(null);
         return true;
      }
   });

   function handleMobilePanelClick(panel: "emoji" | "files") {
      const prevState = activeMobilePanel;
      let newState = prevState === panel ? null : panel;
      if (!newState && !isKeyboardOpen) {
         ReactEditor.focus(editor);
         return;
      }
      if (!newState && isKeyboardOpen) {
         return;
      }
      setActiveMobilePanel(newState);
   }

   const hasAddon = !!(currentEditingMessageId || currentReplyingMessageId || attachments.length);

   return (
      <div className="relative shrink-0">
         <div className="to-surface-deep pointer-events-none absolute inset-x-0 -top-7 right-2.5 z-10 h-7 bg-linear-to-b from-transparent" />

         <ChannelTypingIndicator channelId={channelId!} />
         <div className={clsx("bottom-0 z-10 flex flex-col select-text")}>
            <DraggingIndicator isDragging={dragging} />
            <div
               className={clsx(
                  "bg-surface-alt border-surface mx-2 mb-2 shrink-0 overflow-hidden rounded-xl border-2 transition-[border-radius]",
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
                  <div className="flex gap-x-2 py-2 pl-2">
                     {!currentEditingMessageId &&
                        (isMobileEnvironment ? (
                           <FilePickerButton
                              onClick={() => handleMobilePanelClick("files")}
                              isActive={activeMobilePanel === "files" && !isKeyboardOpenOnEditor}
                           />
                        ) : (
                           <Tooltip>
                              <Tooltip.Trigger asChild>
                                 <FilePickerButton onClick={openFileSelector} />
                              </Tooltip.Trigger>
                              <Tooltip.Content>Upload Files</Tooltip.Content>
                           </Tooltip>
                        ))}
                     {isMobileEnvironment && (
                        <EmojiPickerButton
                           onClick={() => handleMobilePanelClick("emoji")}
                           isActive={activeMobilePanel === "emoji" && !isKeyboardOpenOnEditor}
                        />
                     )}
                  </div>
                  <div className="h-full w-full overflow-hidden">
                     <Slate editor={editor} initialValue={initialValue} onChange={handleEditorOnChange}>
                        <Editable
                           ref={editorRef}
                           onPaste={onPaste}
                           placeholder={`Message ${currentChannel?.name}`}
                           className={clsx(
                              "h-full shrink-0 py-4.25 pl-2 text-start align-baseline leading-[1.5rem] font-normal whitespace-break-spaces text-white caret-white outline-hidden select-text lg:leading-5.5",
                              currentEditingMessageId && "pl-2.25",
                           )}
                           renderLeaf={renderLeaf}
                           renderElement={renderElement}
                           decorate={decorate}
                           onKeyDown={onEditorKeyDown}
                           renderPlaceholder={Placeholder}
                           disableDefaultStyles
                           data-keyboard-no-resize
                        />
                     </Slate>
                  </div>
                  <div className="flex gap-x-2 p-2">
                     {!isMobileEnvironment && (
                        <EmojiPickerButton
                           onClick={(e) => toggleEmojiPicker(e, { onEmojiSelect: insertEmoji })}
                           // The !messageid is to differentiate between the emoji picker being open for a specific message (context menu) vs the message box
                           isActive={emojiPickerPopover?.isOpen && !emojiPickerPopover.data?.messageId}
                        />
                     )}
                     <HuginnButton
                        color="primary"
                        className="flex size-10 cursor-pointer items-center justify-center rounded-full! p-1"
                        type="button"
                        onClick={() => submitMessage()}
                        data-keyboard-no-close
                     >
                        <IconLetsIconsSendHorFill className="text-text size-full" />
                     </HuginnButton>
                  </div>
               </div>
            </div>
            <div style={{ height: shouldShowMobilePanel ? lastKeyboardHeight : undefined }}>
               {activeMobilePanel === "emoji" && <EmojiPickerRawPanel onEmojiSelect={insertEmoji} />}
            </div>
            <FilePickerDrawer
               attachments={attachments}
               isOpen={activeMobilePanel === "files"}
               onOpenChange={(open) => !open && setActiveMobilePanel(null)}
               keyboardHeight={lastKeyboardHeight}
               onAdd={addAttachments}
               onRemove={removeAttachment}
            />
         </div>
      </div>
   );
}
