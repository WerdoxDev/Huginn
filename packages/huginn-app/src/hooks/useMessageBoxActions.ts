import type { KeyboardEvent } from "react";

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
import { useEffect } from "react";
import { type Descendant, Editor, type NodeEntry, Node, type Range } from "slate";

import type { AppMessage, AttachmentType } from "@/types";

function serialize(nodes: Descendant[]) {
   return nodes.map((n) => Node.string(n)).join("\n");
}

interface UseMessageBoxActionsOptions {
   editor: Editor;
   decorate: (entry: NodeEntry) => Range[];
   messages: AppMessage[];
   attachments: AttachmentType[];
   clearAttachments: () => void;
   editorRef: React.RefObject<HTMLDivElement | null>;
}

export function useMessageBoxActions({ editor, decorate, messages, attachments, clearAttachments, editorRef }: UseMessageBoxActionsOptions) {
   const params = useParams({ strict: false });
   const queryClient = useQueryClient();
   const client = useClient();
   const { user } = useThisUser();
   const { setEditingMessageId, currentEditingMessageId, setReplyingMessageId, currentReplyingMessageId } = useChannelStore();

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
      const content = serialize(editor.children);
      const channelId = params.channelId;

      if (!content && !attachments.length) return;
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
         // channelId: previewMessage.channelId,
         // content: previewMessage.content,
         // flags: previewMessage.flags,

         messageReference,
      });

      if (currentReplyingMessageId) {
         setReplyingMessageId(undefined);
      }

      resetTyping();
      clearAttachments();
      clearEditor();
   }

   function editMessage() {
      const content = serialize(editor.children);
      if (!content || !currentEditingMessageId) return;

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

   function onEditorKeyDown(event: KeyboardEvent) {
      // Edit last message on ArrowUp with empty editor
      if (event.key === "ArrowUp" && editor.string([]) === "") {
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

      editor.withoutNormalizing(() => {
         const lines = message.content.split("\n");
         editor.children = lines.map((x) => ({ type: "paragraph", children: [{ text: x }] }));
      });

      editor.normalize({ force: true });
      editor.select(editor.end([]));
      editorRef.current?.focus();
   }, [currentEditingMessageId]);

   // Focus editor when replying
   useEffect(() => {
      if (!currentReplyingMessageId) return;
      editorRef.current?.focus();
   });

   return {
      sendMessage,
      cancelEditMessage,
      cancelReplyMessage,
      onEditorKeyDown,
      resetState,
      currentEditingMessageId,
      currentReplyingMessageId,
      channelId: params.channelId,
   };
}
