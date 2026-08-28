import type { Descendant } from "slate";

import { useInset } from "@contexts/InsetContext";
import { useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { BackHandlerId, useBackHandler } from "@hooks/useBackHandler";
import { useIsMobile } from "@hooks/useIsMobile";
import { useMessageBoxActions } from "@hooks/useMessageBoxActions";
import { useMessageBoxAttachments } from "@hooks/useMessageBoxAttachments";
import { useMessageBoxAutocomplete } from "@hooks/useMessageBoxAutocomplete";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import { useChannelStore } from "@stores/channelStore";
import { usePopover } from "@stores/popoverStore";
import { useHuginnWindow } from "@stores/windowStore";
import clsx from "clsx";
import { useEffect, useMemo, useRef, useState } from "react";
import { Editable, Slate, ReactEditor, type RenderPlaceholderProps } from "slate-react";

import type { AppMessage, AutocompleteItem } from "@/types";

import AttachmentsPreview from "./AttachmentsPreview";
import ExpressionButton from "./button/EmojiPickerButton";
import FilePickerButton from "./button/FilePickerButton";
import HuginnButton from "./button/HuginnButton";
import MessageSendButton from "./button/MessageSendButton";
import ChannelTypingIndicator from "./channels/ChannelTypingIndicator";
import FilePickerDrawer from "./channels/FilePickerDrawer";
import DraggingIndicator from "./DraggingIndicator";
import EditingPreview from "./EditingPreview";
import { MessageAutocomplete } from "./MessageAutocomplete";
import { ExpressionRawPanel } from "./popover/ExpressionRawPanel";
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
   const { setMessageBoxHeight, isRecordingVoice, setIsRecordingVoice, isVoiceRecordingLocked } = useChannelStore();
   const {
      autocompleteKeyIntercept,
      state: autocompleteState,
      items: autocompleteItems,
      containerRef: autocompleteContainerRef,
      handleSet,
      handleClose,
      handleSelectIndex,
      handleSelect,
   } = useMessageBoxAutocomplete({
      channelId: currentChannel?.id,
      onSelect: tempHandleAutocompleteSelect,
   });
   const { decorate, editor, renderElement, renderLeaf, handleEditorChange, handleEditorClick, handleAutocompleteSelect } = usePreviewMessageRenderer(
      {
         onSetAutocomplete: handleSet,
         onCloseAutocomplete: handleClose,
      },
   );
   const editorRef = useRef<HTMLDivElement | null>(null);

   const { attachments, dragging, openFileSelector, addAttachments, removeAttachment, clearAttachments, onPaste } = useMessageBoxAttachments();

   const {
      content,
      submitMessage,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      onEditorChange,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId,
      resetState,
      insertEmoji,
      sendGif,
   } = useMessageBoxActions({ editor, decorate, messages: props.messages, attachments, clearAttachments, autocompleteKeyIntercept });

   const { toggle: toggleExpression, popover: expressionPopover } = usePopover("expression");

   const { isKeyboardOpen, lastKeyboardHeight, focusedElementRef } = useInset();
   const [activeMobilePanel, setActiveMobilePanel] = useState<"expression" | "files" | null>(null);

   const isKeyboardOpenOnEditor = isKeyboardOpen && focusedElementRef?.current === editorRef.current;
   const shouldShowMobilePanel = isMobileEnvironment && (activeMobilePanel !== null || isKeyboardOpenOnEditor);

   // Focus on the message box when we change channel
   useEffect(() => {
      // Clear attachments and reset local state for new channel
      clearAttachments();
      resetState();

      if (isMobile || !editor) return;

      requestAnimationFrame(() => {
         if (editor.children.length !== 0) ReactEditor.focus(editor);
      });
   }, [currentChannel?.id]);

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
               e.preventDefault();
               ReactEditor.focus(editor);
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, [isKeyboardOpen]);

   useEffect(() => {
      if (isKeyboardOpen && isKeyboardOpenOnEditor) setActiveMobilePanel(null);
   }, [isKeyboardOpen]);

   useBackHandler(BackHandlerId.MessageBox, () => {
      if (isKeyboardOpen || activeMobilePanel) {
         setActiveMobilePanel(null);
         return true;
      }
   });

   function handleMobilePanelClick(panel: "expression" | "files") {
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

   function tempHandleAutocompleteSelect(item: AutocompleteItem) {
      handleAutocompleteSelect(item);
   }

   function handleSendGif(url: string) {
      sendGif(url);
      setActiveMobilePanel(null);
   }

   function handleCancelVoiceRecordingClick() {
      setIsRecordingVoice(false);
   }

   const hasAddon = !!(currentEditingMessageId || currentReplyingMessageId || attachments.length);

   return (
      <div className="bg-surface-deep relative shrink-0">
         <div className="to-surface-deep pointer-events-none absolute inset-x-0 -top-10 z-10 h-10 bg-linear-to-b from-transparent" />

         <ChannelTypingIndicator channelId={channelId!} />
         <div className={clsx("bottom-0 z-10 flex flex-col select-text")}>
            <DraggingIndicator isDragging={dragging} />
            <MessageAutocomplete
               state={autocompleteState}
               items={autocompleteItems}
               onSelectIndex={handleSelectIndex}
               onSelect={handleSelect}
               onClose={handleClose}
               editorRef={editorRef}
               containerRef={autocompleteContainerRef}
            />
            <div
               className={clsx(
                  "bg-surface-alt border-surface mx-2 mb-2 shrink-0 rounded-xl border-2 transition-[border-radius]",
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
               <div className="flex h-full items-end lg:items-start">
                  {!isRecordingVoice ? (
                     <>
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
                              <ExpressionButton
                                 onClick={() => handleMobilePanelClick("expression")}
                                 isActive={activeMobilePanel === "expression" && !isKeyboardOpenOnEditor}
                              >
                                 <IconMingcuteEmoji2Fill className="text-text size-full" />
                              </ExpressionButton>
                           )}
                        </div>
                        <div className="h-full w-full overflow-hidden">
                           <Slate editor={editor} initialValue={initialValue} onChange={handleEditorChange} onValueChange={onEditorChange}>
                              <Editable
                                 ref={editorRef}
                                 onPaste={onPaste}
                                 placeholder={`Message ${currentChannel?.name}`}
                                 className={clsx(
                                    "h-full shrink-0 py-4.25 pr-1 pl-2 text-start align-baseline leading-[1.5rem] font-normal whitespace-break-spaces text-white caret-white outline-hidden select-text lg:leading-5.5",
                                    currentEditingMessageId && "pl-2.25",
                                 )}
                                 onClick={handleEditorClick}
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
                     </>
                  ) : (
                     <div className="text-text/80 mr-5 ml-auto flex h-14.5 items-center gap-x-2">
                        {isVoiceRecordingLocked ? (
                           <HuginnButton color="primary" className="px-2 py-1" onClick={handleCancelVoiceRecordingClick}>
                              Cancel
                           </HuginnButton>
                        ) : (
                           <>
                              <IconMingcuteArrowLeftFill className="size-5" />
                              <div className="box-exact">swipe to cancel</div>
                           </>
                        )}
                     </div>
                  )}
                  <div className="flex gap-x-2 p-2 pl-1">
                     {!isMobileEnvironment && !isRecordingVoice && (
                        <>
                           <ExpressionButton
                              onClick={(e) =>
                                 toggleExpression(e, { type: "full", onEmojiSelect: insertEmoji, onGifSelect: handleSendGif, activeTab: "gif" })
                              }
                              // The !messageid is to differentiate between the emoji picker being open for a specific message (context menu) vs the message box
                              isActive={
                                 expressionPopover?.isOpen && !expressionPopover.data?.messageId && expressionPopover.data?.activeTab === "gif"
                              }
                           >
                              <span className="box-exact text-sm">GIF</span>
                           </ExpressionButton>
                           <ExpressionButton
                              onClick={(e) =>
                                 toggleExpression(e, { type: "full", onEmojiSelect: insertEmoji, onGifSelect: handleSendGif, activeTab: "emoji" })
                              }
                              isActive={
                                 expressionPopover?.isOpen && !expressionPopover.data?.messageId && expressionPopover.data?.activeTab === "emoji"
                              }
                           >
                              <IconMingcuteEmoji2Fill className="text-text size-full" />
                           </ExpressionButton>
                        </>
                     )}
                     <MessageSendButton onSubmit={submitMessage} content={content} />
                  </div>
               </div>
            </div>
            <div style={{ height: shouldShowMobilePanel ? lastKeyboardHeight : undefined }}>
               {activeMobilePanel === "expression" && <ExpressionRawPanel onEmojiSelect={insertEmoji} onGifSelect={handleSendGif} type="full" />}
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
