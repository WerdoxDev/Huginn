import type { KeyboardEvent } from "react";
import type { TextUnitAdjustment } from "slate";

import { useEditMessage } from "@hooks/mutations/useEditMessage";
import { useSendMessage } from "@hooks/mutations/useSendMessage";
import { useSendTyping } from "@hooks/mutations/useSendTyping";
import { MessageFlags, MessageReferenceType, MessageType } from "@huginn/shared";
import { createPreviewMessage } from "@lib/utils";
import { useChannelStore } from "@stores/channelStore";
import { useClient } from "@stores/clientStore";
import { useThisUser } from "@stores/userStore";
import { useQueryClient } from "@tanstack/react-query";
import { useParams } from "@tanstack/react-router";
import { usePostHog } from "posthog-js/react";
import { useEffect, useRef } from "react";
import { type Descendant, Editor, type NodeEntry, Range, Element, Transforms, Point, type BaseSelection, Text } from "slate";
import { ReactEditor } from "slate-react";

import type { AppMessage, AttachmentType } from "@/types";

function serialize(nodes: Descendant[]) {
   let text = "";
   for (const node of nodes) {
      if (Text.isText(node)) {
         text += node.text;
         continue;
      }

      const children = serialize(node.children);

      if (Element.isElement(node) && node.type === "emoji") {
         text += node.emoji ? node.emoji : `:${node.slug}:`;
         continue;
      }

      if (Element.isElement(node) && node.type === "paragraph") {
         text += children + "\n";
         continue;
      }
   }

   return text;
}

interface UseMessageBoxActionsOptions {
   editor: Editor;
   decorate: (entry: NodeEntry) => Range[];
   messages: AppMessage[];
   attachments: AttachmentType[];
   clearAttachments: () => void;
   editorRef: React.RefObject<HTMLDivElement | null>;
}

export function useMessageBoxActions({ editor, decorate, messages, attachments, clearAttachments }: UseMessageBoxActionsOptions) {
   const params = useParams({ strict: false });
   const queryClient = useQueryClient();
   const client = useClient();
   const { user } = useThisUser();
   const { setEditingMessageId, currentEditingMessageId, setReplyingMessageId, currentReplyingMessageId } = useChannelStore();
   const posthog = usePostHog();
   const shouldFocusEditor = useRef(true);

   const sendMessageMutation = useSendMessage();
   const editMessageMutation = useEditMessage();
   const { reset: resetTyping, mutate: sendTypingMutate } = useSendTyping();

   function clearEditor() {
      editor.delete({
         at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
         },
      });
   }

   function sendMessage(flags: MessageFlags) {
      if (isEditorEmpty() && attachments.length === 0) return;

      const content = serialize(editor.children).trim();
      const channelId = params.channelId;

      if (!content && !attachments.length) return;
      if (!user || !channelId || !client) return;

      posthog.capture("message:send", {
         has_attachments: attachments.length > 0,
         attachment_count: attachments.length,
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
         attachments: attachments?.map((x) => ({
            id: x.id,
            contentType: x.contentType,
            data: x.arrayBuffer,
            filename: x.filename,
            description: x.description,
         })),
         messageReference,
      });

      sendMessageMutation.mutate({
         previewMessage,
      });

      if (currentReplyingMessageId) {
         setReplyingMessageId(undefined);
      }

      resetTyping();
      clearAttachments();
      clearEditor();
   }

   function insertEmoji(slug: string) {
      editor.insertText(slug);
      // editor.insertNode({ type: "emoji", slug, children: [{ text: "" }] });
      // editor.move({ unit: "offset" });
      editor.insertText(" ");
      ReactEditor.focus(editor);
   }

   function editMessage() {
      const content = serialize(editor.children).trim();
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
         ...editor.nodes({
            at: { anchor: editor.start([]), focus: editor.end([]) },
            match: (x) => (Text.isText(x) && x.text !== "") || (Element.isElement(x) && x.type === "emoji"),
         }),
      ];

      return editorNodes.length === 0;
   }

   function toggleMarkAtSelection(markType: "bold" | "italic" | "underline") {
      if (!editor.selection) return;

      const mark = markType === "bold" ? "**" : markType === "italic" ? "*" : markType === "underline" ? "__" : "";
      const markLength = mark.length;
      const path = editor.selection.anchor.path;
      const nodeAtSelection = editor.leaf(editor.selection);

      for (const node of editor.nodes({ at: editor.selection, mode: "lowest" })) {
         const decoration = decorate(node).find(
            (x) => (x.bold && markType === "bold") || (x.italic && markType === "italic") || (x.underline && markType === "underline"),
         );

         const startOffset = Math.min(editor.selection.anchor.offset, editor.selection.focus.offset);
         const endOffset = Math.max(editor.selection.anchor.offset, editor.selection.focus.offset);

         if (!decoration) {
            editor.insertText(mark, { at: { offset: startOffset, path: path } });

            editor.insertText(mark, { at: { offset: endOffset + markLength, path: path } });
            editor.select({
               anchor: { offset: startOffset + markLength, path: path },
               focus: { offset: endOffset + markLength, path: path },
            });
            return;
         }

         const nodeText = nodeAtSelection[0].text;
         const actualText = nodeText.slice(startOffset, endOffset);
         const guessText = nodeText.slice(Math.max(startOffset - markLength, 0), endOffset + markLength);
         if (guessText === `${mark}${actualText}${mark}`) {
            editor.delete({
               at: {
                  anchor: { offset: startOffset - markLength, path: path },
                  focus: { offset: startOffset, path: path },
               },
            });
            editor.delete({
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

   function resolveEmojiNavigation(
      event: KeyboardEvent,
      requireShift?: boolean,
   ): { targetPoint: Point; isExtendingLeft: boolean; selection: BaseSelection } | null {
      if (requireShift && !event.shiftKey) return null;
      if (!["ArrowLeft", "ArrowRight"].includes(event.key)) return null;

      const { selection } = editor;
      if (!selection) return null;

      const isRTL = checkIsRTL(editor);
      const isExtendingLeft = event.key === (isRTL ? "ArrowRight" : "ArrowLeft");

      const adjacent = isExtendingLeft
         ? Editor.before(editor, selection.focus, { unit: "block" })
         : Editor.after(editor, selection.focus, { unit: "block" });
      if (!adjacent) return null;

      const [, path] = Editor.node(editor, adjacent);

      try {
         const [parentNode, parentPath] = Editor.parent(editor, path);
         if (Element.isElement(parentNode) && parentNode.type === "emoji") {
            // Verify the cursor is immediately adjacent to the emoji boundary,
            // not somewhere further away inside the same block.
            const emojiEdgePoint = isExtendingLeft
               ? Editor.after(editor, parentPath, { unit: "block" })
               : Editor.before(editor, parentPath, { unit: "block" });

            if (!emojiEdgePoint || !Point.equals(selection.focus, emojiEdgePoint)) {
               return null;
            }

            const targetPoint = isExtendingLeft
               ? Editor.before(editor, parentPath, { unit: "block" })
               : Editor.after(editor, parentPath, { unit: "block" });

            if (!targetPoint) return null;

            return { targetPoint, isExtendingLeft, selection };
         }
      } catch {
         return null;
      }

      return null;
   }

   function skipEmojiElementOnArrowNavigation(event: KeyboardEvent) {
      if (event.shiftKey) return; // let the other handler take shift+arrow
      const result = resolveEmojiNavigation(event);
      if (!result) return;

      event.preventDefault();
      Transforms.select(editor, result.targetPoint); // collapses to target
   }

   function isEmoji(editor: Editor, node: any) {
      return Element.isElement(node) && editor.isVoid(node) && node.type === "emoji";
   }

   function getNextBoundary(editor: Editor, from: Point, unit: TextUnitAdjustment): Point | undefined {
      let nextWord = Editor.after(editor, from, { unit });
      if (nextWord) {
         const [parentNode] = Editor.parent(editor, nextWord);
         if (isEmoji(editor, parentNode)) nextWord = Editor.after(editor, nextWord, { unit });
      }

      const nextEmojiEntry = Editor.nodes(editor, {
         at: [],
         match: (n) => Element.isElement(n) && n.type === "emoji",
      });

      let nearestEmojiStart: Point | null = null;

      for (const [, path] of nextEmojiEntry) {
         const before = Editor.before(editor, path);
         if (!before) continue;

         if (Point.isAfter(before, from)) {
            nearestEmojiStart = before;
            break;
         }
      }

      if (!nearestEmojiStart) return nextWord;
      if (!nextWord) return nearestEmojiStart;

      return Point.isBefore(nearestEmojiStart, nextWord) ? nearestEmojiStart : nextWord;
   }

   function getPreviousBoundary(editor: Editor, from: Point, unit: TextUnitAdjustment): Point | undefined {
      let previousWord = Editor.before(editor, from, { unit });
      if (previousWord) {
         const [parentNode] = Editor.parent(editor, previousWord);
         if (isEmoji(editor, parentNode)) {
            previousWord = Editor.before(editor, previousWord, { unit });
         }
      }

      const previousEmojiEntry = Editor.nodes(editor, {
         at: [],
         match: (n) => Element.isElement(n) && n.type === "emoji",
         reverse: true,
      });

      let nearestEmojiEnd: Point | null = null;

      for (const [, path] of previousEmojiEntry) {
         const after = Editor.after(editor, path);
         if (!after) continue;

         if (Point.isBefore(after, from)) {
            nearestEmojiEnd = after;
            break;
         }
      }

      if (!nearestEmojiEnd) return previousWord;
      if (!previousWord) return nearestEmojiEnd;

      return Point.isAfter(nearestEmojiEnd, previousWord) ? nearestEmojiEnd : previousWord;
   }

   function interceptArrowNavigation(event: KeyboardEvent, unit: TextUnitAdjustment) {
      const isRTL = checkIsRTL(editor);
      if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
      const isMovingRight = event.key === (!isRTL ? "ArrowRight" : "ArrowLeft");

      const { selection } = editor;
      if (!selection) return;

      const boundary = isMovingRight ? getNextBoundary(editor, selection.focus, unit) : getPreviousBoundary(editor, selection.focus, unit);
      if (boundary) {
         event.preventDefault();

         if (event.shiftKey) {
            Transforms.select(editor, { anchor: selection.anchor, focus: boundary });
         } else {
            Transforms.select(editor, boundary);
         }
      }
   }

   function onEditorKeyDown(event: KeyboardEvent) {
      if (event.ctrlKey) {
         interceptArrowNavigation(event, "word");
      } else if (event.shiftKey) interceptArrowNavigation(event, "character");
      else if (editor.selection && Range.isCollapsed(editor.selection)) skipEmojiElementOnArrowNavigation(event);

      // Edit last message on ArrowUp with empty editor
      if (event.key === "ArrowUp" && isEditorEmpty()) {
         const lastEditableMessage = messages.findLast((x) => x.authorId === user?.id && !x.isPreview && x.type === MessageType.DEFAULT);
         setEditingMessageId(lastEditableMessage?.id);
         event.preventDefault();
      }
      if (!event.shiftKey && event.code === "Enter") {
         if (currentEditingMessageId) {
            editMessage();
         } else {
            const flags: MessageFlags = event.ctrlKey ? MessageFlags.SUPPRESS_NOTIFICATIONS : MessageFlags.NONE;
            sendMessage(flags);
         }
         event.preventDefault();
      }
      if (event.ctrlKey && event.key === "b" && editor.selection) toggleMarkAtSelection("bold");
      if (event.ctrlKey && event.key === "i" && editor.selection) toggleMarkAtSelection("italic");
      if (event.ctrlKey && event.key === "u" && editor.selection) toggleMarkAtSelection("underline");
      if (event.key === "Escape") clearAttachments();
      sendTypingMutate(event, { channelId: params.channelId ?? "" });
   }

   function onEmojiPanelOpenChanged(open: boolean) {
      shouldFocusEditor.current = !open;
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
            if (!e.metaKey && !e.ctrlKey && !e.shiftKey && !e.altKey && !ReactEditor.isFocused(editor) && shouldFocusEditor.current) {
               editor.select(editor.end([]));
               ReactEditor.focus(editor);
               // e.preventDefault();
               // editor.insertText(e.key);
            }
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, [currentEditingMessageId, currentReplyingMessageId]);

   // Load message content when editing starts
   useEffect(() => {
      if (!currentEditingMessageId) return;

      const message = messages.find((x) => x.id === currentEditingMessageId);
      if (!message) return;

      const lines = message.content.trim().split("\n");

      editor.select({ anchor: editor.start([]), focus: editor.start([]) });
      editor.delete();

      editor.select(editor.start([]));

      let lineIndex = 0;
      for (const line of lines) {
         if (lineIndex !== 0) editor.insertNode({ type: "paragraph", children: [{ text: "" }] });
         editor.insertText(line);
         console.log(line);
         lineIndex++;
      }

      ReactEditor.focus(editor);
   }, [currentEditingMessageId]);

   // Focus editor when replying
   useEffect(() => {
      if (!currentReplyingMessageId) return;
      ReactEditor.focus(editor);
   }, [currentReplyingMessageId]);

   return {
      sendMessage,
      insertEmoji,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      onEmojiPanelOpenChanged,
      resetState,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId: params.channelId,
   };
}
