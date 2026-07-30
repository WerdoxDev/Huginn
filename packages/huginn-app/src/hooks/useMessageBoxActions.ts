import type { KeyboardEvent } from "react";
import type { TextUnitAdjustment } from "slate";

import { useEditMessage } from "@hooks/mutations/useEditMessage";
import { useSendMessage } from "@hooks/mutations/useSendMessage";
import { useSendTyping } from "@hooks/mutations/useSendTyping";
import { MessageFlags, MessageReferenceType, MessageType } from "@huginn/shared";
import { createPreviewMessage, serializeSlate } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useEffect } from "react";
import { Editor, type NodeEntry, Range, Element, Transforms, Point, type BaseSelection, Text } from "slate";
import { ReactEditor } from "slate-react";

import type { AppMessage, AppAttachment } from "@/types";

import { useIsMobile } from "./useIsMobile";

const INTERCEPT_ELEMENT_TYPES = ["emoji", "mention"];

function isWorthyKeyEvent(event: globalThis.KeyboardEvent) {
   if (event.key.includes("Shift") || event.key.includes("Control") || event.key.includes("Alt") || event.key.includes("Meta") || event.ctrlKey) {
      return false;
   }
   return true;
}

export function useMessageBoxActions(options: {
   editor: Editor;
   decorate: (entry: NodeEntry) => Range[];
   messages: AppMessage[];
   attachments: AppAttachment[];
   clearAttachments: () => void;
   autocompleteKeyIntercept: (event: KeyboardEvent) => boolean;
}) {
   const params = useParams({ strict: false });
   const queryClient = useQueryClient();
   const client = useClient();
   const { user } = useThisUser();
   const { setEditingMessageId, currentEditingMessageId, setReplyingMessageId, currentReplyingMessageId } = useChannelStore();
   const posthog = usePostHog();
   const isMobile = useIsMobile();

   const sendMessageMutation = useSendMessage();
   const editMessageMutation = useEditMessage();
   const { reset: resetTyping, mutate: sendTypingMutate } = useSendTyping();

   function clearEditor() {
      options.editor.delete({
         at: {
            anchor: Editor.start(options.editor, []),
            focus: Editor.end(options.editor, []),
         },
      });
   }

   function submitMessage() {
      if (currentEditingMessageId) {
         editMessage();
      } else {
         const flags: MessageFlags = MessageFlags.NONE;
         sendMessage(flags);
      }
   }

   function sendGif(gifUrl: string) {
      const channelId = params.channelId;
      if (!user || !channelId || !client) return;

      const messageReference = currentReplyingMessageId
         ? {
              messageId: currentReplyingMessageId,
              channelId: channelId,
              type: MessageReferenceType.DEFAULT,
           }
         : undefined;

      const nonce = client.generateNonce();
      const previewMessage = createPreviewMessage(queryClient, {
         authorId: user.id,
         channelId,
         content: gifUrl,
         nonce,
         flags: MessageFlags.NONE,
         messageReference,
      });

      sendMessageMutation.mutate({
         previewMessage,
      });

      if (currentReplyingMessageId) {
         setReplyingMessageId(undefined);
      }

      resetTyping();
      options.clearAttachments();
      clearEditor();
   }

   function sendMessage(flags: MessageFlags) {
      if (isEditorEmpty() && options.attachments.length === 0) return;

      const content = serializeSlate(options.editor.children).trim();
      const channelId = params.channelId;

      if (!content && !options.attachments.length) return;
      if (!user || !channelId || !client) return;

      posthog.capture("message:send", {
         has_attachments: options.attachments.length > 0,
         attachment_count: options.attachments.length,
         is_reply: !!currentReplyingMessageId,
         has_suppress_notifications: !!(flags & MessageFlags.SUPPRESS_NOTIFICATIONS),
      });

      const messageReference = currentReplyingMessageId
         ? {
              messageId: currentReplyingMessageId,
              channelId: channelId,
              type: MessageReferenceType.DEFAULT,
           }
         : undefined;

      const nonce = client.generateNonce();
      const previewMessage = createPreviewMessage(queryClient, {
         authorId: user.id,
         channelId,
         content,
         nonce,
         flags,
         attachments: options.attachments,
         messageReference,
      });

      sendMessageMutation.mutate({
         previewMessage,
      });

      if (currentReplyingMessageId) {
         setReplyingMessageId(undefined);
      }

      resetTyping();
      options.clearAttachments();
      clearEditor();
   }

   function insertEmoji(slug: string) {
      options.editor.insertText(slug);
      options.editor.insertText(" ");
      ReactEditor.focus(options.editor);
   }

   function editMessage() {
      const content = serializeSlate(options.editor.children).trim();
      if (!content || !currentEditingMessageId || isEditorEmpty()) return;

      posthog.capture("message:edited");
      editMessageMutation.mutate({
         channelId: params.channelId ?? "",
         messageId: currentEditingMessageId,
         content,
      });

      clearEditor();
      setEditingMessageId(undefined);
   }

   function cancelEditMessage() {
      clearEditor();
      setEditingMessageId(undefined);
   }

   function cancelReplyMessage() {
      setReplyingMessageId(undefined);
   }

   function resetState() {
      setReplyingMessageId(undefined);
      setEditingMessageId(undefined);
   }

   function isEditorEmpty() {
      const editorNodes = [
         ...options.editor.nodes({
            at: { anchor: options.editor.start([]), focus: options.editor.end([]) },
            match: (x) => (Text.isText(x) && x.text !== "") || (Element.isElement(x) && INTERCEPT_ELEMENT_TYPES.includes(x.type)),
         }),
      ];

      return editorNodes.length === 0;
   }

   function toggleMarkAtSelection(markType: "bold" | "italic" | "underline") {
      if (!options.editor.selection) return;

      const mark = markType === "bold" ? "**" : markType === "italic" ? "*" : markType === "underline" ? "__" : "";
      const markLength = mark.length;
      const path = options.editor.selection.anchor.path;
      const nodeAtSelection = options.editor.leaf(options.editor.selection);

      for (const node of options.editor.nodes({ at: options.editor.selection, mode: "lowest" })) {
         const decoration = options
            .decorate(node)
            .find((x) => (x.bold && markType === "bold") || (x.italic && markType === "italic") || (x.underline && markType === "underline"));

         const startOffset = Math.min(options.editor.selection.anchor.offset, options.editor.selection.focus.offset);
         const endOffset = Math.max(options.editor.selection.anchor.offset, options.editor.selection.focus.offset);

         if (!decoration) {
            options.editor.insertText(mark, { at: { offset: startOffset, path: path } });

            options.editor.insertText(mark, { at: { offset: endOffset + markLength, path: path } });
            options.editor.select({
               anchor: { offset: startOffset + markLength, path: path },
               focus: { offset: endOffset + markLength, path: path },
            });
            return;
         }

         const nodeText = nodeAtSelection[0].text;
         const actualText = nodeText.slice(startOffset, endOffset);
         const guessText = nodeText.slice(Math.max(startOffset - markLength, 0), endOffset + markLength);
         if (guessText === `${mark}${actualText}${mark}`) {
            options.editor.delete({
               at: {
                  anchor: { offset: startOffset - markLength, path: path },
                  focus: { offset: startOffset, path: path },
               },
            });
            options.editor.delete({
               at: {
                  anchor: { offset: endOffset - markLength, path: path },
                  focus: { offset: endOffset, path: path },
               },
            });
            return;
         }
      }
   }

   function checkIsRTL(editor: Editor) {
      const { selection } = editor;
      if (!selection) return false;

      const [parentElement] = editor.node(selection.focus, { depth: 1 });
      const domNode = ReactEditor.toDOMNode(editor, parentElement);

      const isRTL = domNode.dir === "rtl";
      return isRTL;
   }

   function resolveInterceptNavigation(
      event: KeyboardEvent,
      requireShift?: boolean,
   ): { targetPoint: Point; isExtendingLeft: boolean; selection: BaseSelection } | null {
      if (requireShift && !event.shiftKey) return null;
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return null;

      const { selection } = options.editor;
      if (!selection) return null;

      const isRTL = checkIsRTL(options.editor);
      const isExtendingLeft = event.key === (isRTL ? "ArrowRight" : "ArrowLeft");

      const adjacent = isExtendingLeft
         ? Editor.before(options.editor, selection.focus, { unit: "block" })
         : Editor.after(options.editor, selection.focus, { unit: "block" });
      if (!adjacent) return null;

      const [, path] = Editor.node(options.editor, adjacent);

      try {
         const [parentNode, parentPath] = Editor.parent(options.editor, path);
         if (Element.isElement(parentNode) && INTERCEPT_ELEMENT_TYPES.includes(parentNode.type)) {
            // Verify the cursor is immediately adjacent to the intercept boundary,
            // not somewhere further away inside the same block.
            const interceptEdgePoint = isExtendingLeft
               ? Editor.after(options.editor, parentPath, { unit: "block" })
               : Editor.before(options.editor, parentPath, { unit: "block" });

            if (!interceptEdgePoint || !Point.equals(selection.focus, interceptEdgePoint)) {
               return null;
            }

            const targetPoint = isExtendingLeft
               ? Editor.before(options.editor, parentPath, { unit: "block" })
               : Editor.after(options.editor, parentPath, { unit: "block" });

            if (!targetPoint) return null;

            return { targetPoint, isExtendingLeft, selection };
         }
      } catch {
         return null;
      }

      return null;
   }

   function skipInterceptElementOnArrowNavigation(event: KeyboardEvent) {
      if (event.shiftKey) return; // let the other handler take shift+arrow
      const result = resolveInterceptNavigation(event);
      if (!result) return;

      event.preventDefault();
      Transforms.select(options.editor, result.targetPoint); // collapses to target
   }

   function isIntercept(editor: Editor, node: any) {
      return Element.isElement(node) && editor.isVoid(node) && INTERCEPT_ELEMENT_TYPES.includes(node.type);
   }

   function getNextBoundary(editor: Editor, from: Point, unit: TextUnitAdjustment): Point | undefined {
      let nextWord = Editor.after(options.editor, from, { unit });
      if (nextWord) {
         const [parentNode] = Editor.parent(options.editor, nextWord);
         if (isIntercept(editor, parentNode)) nextWord = Editor.after(options.editor, nextWord, { unit });
      }

      const nextInterceptEntry = Editor.nodes(options.editor, {
         at: [],
         match: (n) => Element.isElement(n) && INTERCEPT_ELEMENT_TYPES.includes(n.type),
      });

      let nearestInterceptStart: Point | null = null;

      for (const [, path] of nextInterceptEntry) {
         const before = Editor.before(options.editor, path);
         if (!before) continue;

         if (Point.isAfter(before, from)) {
            nearestInterceptStart = before;
            break;
         }
      }

      if (!nearestInterceptStart) return nextWord;
      if (!nextWord) return nearestInterceptStart;

      return Point.isBefore(nearestInterceptStart, nextWord) ? nearestInterceptStart : nextWord;
   }

   function getPreviousBoundary(editor: Editor, from: Point, unit: TextUnitAdjustment): Point | undefined {
      let previousWord = Editor.before(options.editor, from, { unit });
      if (previousWord) {
         const [parentNode] = Editor.parent(options.editor, previousWord);
         if (isIntercept(editor, parentNode)) {
            previousWord = Editor.before(options.editor, previousWord, { unit });
         }
      }

      const previousInterceptEntry = Editor.nodes(options.editor, {
         at: [],
         match: (n) => Element.isElement(n) && INTERCEPT_ELEMENT_TYPES.includes(n.type),
         reverse: true,
      });

      let nearestInterceptEnd: Point | null = null;

      for (const [, path] of previousInterceptEntry) {
         const after = Editor.after(options.editor, path);
         if (!after) continue;

         if (Point.isBefore(after, from)) {
            nearestInterceptEnd = after;
            break;
         }
      }

      if (!nearestInterceptEnd) return previousWord;
      if (!previousWord) return nearestInterceptEnd;

      return Point.isAfter(nearestInterceptEnd, previousWord) ? nearestInterceptEnd : previousWord;
   }

   function interceptArrowNavigation(event: KeyboardEvent, unit: TextUnitAdjustment) {
      const isRTL = checkIsRTL(options.editor);
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const isMovingRight = event.key === (!isRTL ? "ArrowRight" : "ArrowLeft");

      const { selection } = options.editor;
      if (!selection) return;

      const boundary = isMovingRight
         ? getNextBoundary(options.editor, selection.focus, unit)
         : getPreviousBoundary(options.editor, selection.focus, unit);
      if (boundary) {
         event.preventDefault();

         if (event.shiftKey) {
            Transforms.select(options.editor, { anchor: selection.anchor, focus: boundary });
         } else {
            Transforms.select(options.editor, boundary);
         }
      }
   }

   function onEditorKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey) {
         interceptArrowNavigation(event, "word");
      } else if (event.shiftKey) interceptArrowNavigation(event, "character");
      else if (options.editor.selection && Range.isCollapsed(options.editor.selection)) skipInterceptElementOnArrowNavigation(event);

      if (options.autocompleteKeyIntercept(event) === true) {
         event.preventDefault();
         return;
      }

      // Edit last message on ArrowUp with empty editor
      if (event.key === "ArrowUp" && isEditorEmpty()) {
         const lastEditableMessage = options.messages.findLast((x) => x.authorId === user?.id && !x.isPreview && x.type === MessageType.DEFAULT);
         setEditingMessageId(lastEditableMessage?.id);
         event.preventDefault();
      }
      if (!event.shiftKey && event.code === "Enter" && !isMobile) {
         submitMessage();
         event.preventDefault();
      }
      if (event.ctrlKey && event.key === "b" && options.editor.selection) toggleMarkAtSelection("bold");
      if (event.ctrlKey && event.key === "i" && options.editor.selection) toggleMarkAtSelection("italic");
      if (event.ctrlKey && event.key === "u" && options.editor.selection) toggleMarkAtSelection("underline");
      if (event.key === "Escape") options.clearAttachments();
      sendTypingMutate(event, { channelId: params.channelId ?? "" });
   }

   // Escape key handler for canceling edit/reply
   useEffect(() => {
      const controller = new AbortController();

      window.addEventListener(
         "keydown",
         (e) => {
            if (e.key === "Escape") {
               if (currentEditingMessageId) cancelEditMessage();
               if (currentReplyingMessageId) cancelReplyMessage();
            }

            const isPortalOpen = !!document.querySelector("[data-base-ui-portal]");
            const isInputFocused = document.activeElement && ["INPUT", "TEXTAREA"].includes(document.activeElement.tagName);

            if (!isInputFocused && !isPortalOpen && !ReactEditor.isFocused(options.editor) && isWorthyKeyEvent(e)) {
               options.editor.select(options.editor.end([]));
               ReactEditor.focus(options.editor);
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, [currentEditingMessageId, currentReplyingMessageId]);

   // Load message content when editing starts
   useEffect(() => {
      if (!currentEditingMessageId) return;

      const message = options.messages.find((x) => x.id === currentEditingMessageId);
      if (!message) return;

      const lines = message.content.trim().split("\n");

      options.editor.select({ anchor: options.editor.start([]), focus: options.editor.start([]) });
      options.editor.delete();

      options.editor.select(options.editor.start([]));

      let lineIndex = 0;
      for (const line of lines) {
         if (lineIndex !== 0) options.editor.insertNode({ type: "paragraph", children: [{ text: "" }] });
         options.editor.insertText(line);
         lineIndex++;
      }

      ReactEditor.focus(options.editor);
   }, [currentEditingMessageId]);

   // Focus editor when replying
   useEffect(() => {
      if (!currentReplyingMessageId) return;
      ReactEditor.focus(options.editor);
   }, [currentReplyingMessageId]);

   return {
      sendGif,
      submitMessage,
      insertEmoji,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      resetState,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId: params.channelId,
   };
}
