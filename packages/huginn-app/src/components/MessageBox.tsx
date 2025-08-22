import { useChannelName, useCurrentChannel } from "@hooks/api-hooks/channelHooks";
import { useSendMessage } from "@hooks/mutations/useSendMessage";
import { useSendTyping } from "@hooks/mutations/useSendTyping";
import { isImageMediaType, MessageFlags, MessageType } from "@huginn/shared";
import { dispatchEvent } from "@lib/event-handler";
import clsx from "clsx";
import { type ClipboardEvent, type KeyboardEvent, useEffect, useRef, useState, useTransition } from "react";
import { useParams } from "react-router";
import { type Descendant, Editor, Node } from "slate";
import { Editable, Slate } from "slate-react";
import type { AppMessage, AttachmentType } from "@/types";
import AttachmentsPreview from "./AttachmentsPreview";
import DraggingIndicator from "./DraggingIndicator";
import Tooltip from "./tooltip/Tooltip";
import { useChannelStore } from "@stores/channelStore";
import { usePreviewMessageRenderer } from "@hooks/usePreviewMessageRenderer";
import { useEditMessage } from "@hooks/mutations/useEditMessage";
import { useThisUser } from "@stores/userStore";

type AttachmentInputType = { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> };

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
   const params = useParams();
   const editorRef = useRef<HTMLDivElement>(null);
   const containerRef = useRef<HTMLDivElement>(null);
   const currentChannel = useCurrentChannel();
   const channelName = useChannelName(currentChannel?.id);
   const [attachments, setAttachments] = useState<AttachmentType[]>([]);
   const [dragging, setDragging] = useState(false);
   const [_isPending, startTransition] = useTransition();
   const { setEditingMessageId, currentEditingMessageId, setMessageBoxHeight } = useChannelStore();
   const { decorate, editor, renderElement, renderLeaf } = usePreviewMessageRenderer();
   const { user } = useThisUser();

   const sendMessageMutation = useSendMessage();
   const editMessageMutation = useEditMessage();
   const { reset: resetTyping, mutate: sendTypingMutate } = useSendTyping();

   function onEditorKeyDown(event: KeyboardEvent) {
      // Edit
      if (event.key === "ArrowUp" && editor.string([]) === "") {
         const lastEditableMessage = props.messages.findLast((x) => x.authorId === user?.id && !x.isPreview && x.type === MessageType.DEFAULT);
         setEditingMessageId(lastEditableMessage?.id);
         event.preventDefault();
      }

      if (!event.shiftKey && event.code === "Enter") {
         // Edit message
         if (currentEditingMessageId) {
            editMessage();
         }
         // Send message
         else {
            const flags: MessageFlags = event.ctrlKey ? MessageFlags.SUPPRESS_NOTIFICATIONS : MessageFlags.NONE;
            sendMessage(flags);
         }
         event.preventDefault();
      }

      if (event.ctrlKey && event.key === "b" && editor.selection) {
         toggleMarkAtSelection("bold");
      }
      if (event.ctrlKey && event.key === "i" && editor.selection) {
         toggleMarkAtSelection("italic");
      }
      if (event.ctrlKey && event.key === "u" && editor.selection) {
         toggleMarkAtSelection("underline");
      }
      if (event.key === "Escape") {
         setAttachments([]);
      }

      sendTypingMutate(event, { channelId: params.channelId ?? "" });
   }

   function toggleMarkAtSelection(markType: "bold" | "italic" | "underline") {
      if (!editor.selection) {
         return;
      }

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
            editor.select({ anchor: { offset: startOffset + markLength, path: path }, focus: { offset: endOffset + markLength, path: path } });
            return;
         }

         const nodeText = nodeAtSelection[0].text;
         const actualText = nodeText.slice(startOffset, endOffset);
         const guessText = nodeText.slice(Math.max(startOffset - markLength, 0), endOffset + markLength);
         if (guessText === `${mark}${actualText}${mark}`) {
            editor.delete({ at: { anchor: { offset: startOffset - markLength, path: path }, focus: { offset: startOffset, path: path } } });
            editor.delete({ at: { anchor: { offset: endOffset - markLength, path: path }, focus: { offset: endOffset, path: path } } });
            return;
         }
      }
   }

   function sendMessage(flags: MessageFlags) {
      const content = serialize(editor.children);
      if (!content && !attachments.length) {
         return;
      }

      sendMessageMutation.mutate({
         channelId: params.channelId ?? "",
         content,
         flags,
         attachments: attachments.map((x) => ({
            id: x.id,
            contentType: x.contentType,
            data: x.arrayBuffer,
            filename: x.filename,
            description: x.description,
         })),
      });

      resetTyping();
      clearEditor();
   }

   function editMessage() {
      const content = serialize(editor.children);
      if (!content || !currentEditingMessageId) {
         return;
      }

      editMessageMutation.mutate({ channelId: params.channelId ?? "", messageId: currentEditingMessageId, content });

      clearEditor();
      setEditingMessageId(undefined);
   }

   function endEditMessage() {
      clearEditor();
      setEditingMessageId(undefined);
   }

   function clearEditor() {
      editor.delete({
         at: {
            anchor: Editor.start(editor, []),
            focus: Editor.end(editor, []),
         },
      });
   }

   function serialize(nodes: Descendant[]) {
      return nodes.map((n) => Node.string(n)).join("\n");
   }

   function addFiles() {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = true;

      input.onchange = async (e) => {
         const inputFiles = (e.target as HTMLInputElement).files;
         if (!inputFiles) return;

         await addAttachments(Array.from(inputFiles));
      };

      input.click();
   }

   async function addAttachments(input: AttachmentInputType[]) {
      startTransition(async () => {
         const attachments: AttachmentType[] = [];
         for (const [i, file] of input.entries()) {
            const arrayBuffer = await file.arrayBuffer();
            if (!isImageMediaType(file.type)) {
               attachments.push({ id: i, arrayBuffer: arrayBuffer, dataUrl: undefined, filename: file.name, contentType: file.type });
               continue;
            }

            const reader = new FileReader();
            reader.readAsDataURL(new Blob([arrayBuffer]));

            const dataUrl = await new Promise<string>((res, rej) => {
               reader.onload = (readerEvent) => {
                  const content = readerEvent.target?.result;
                  if (typeof content === "string") {
                     res(content);
                  }
               };

               reader.onerror = () => {
                  rej();
               };
            });

            attachments.push({ id: i, arrayBuffer: arrayBuffer, dataUrl: dataUrl, filename: file.name, contentType: file.type });
         }

         setAttachments(attachments);
         editorRef.current?.focus();
      });
   }

   function removeAttachment(id: number) {
      setAttachments((old) => old.filter((x) => x.id !== id));
   }

   function onPaste(e: ClipboardEvent) {
      addAttachments(Array.from(e.clipboardData.files));
   }

   // This is to match the updating of channel messages and message box in a single frame so that upon rendering a new preview message,
   // the attachments are also cleared. So everything happens in one frame.
   useEffect(() => {
      setAttachments([]);
   }, [props.messages]);

   // Focus on the message box when we change channel
   useEffect(() => {
      editorRef.current?.focus();
   }, [currentChannel?.id]);

   useEffect(() => {
      if (!containerRef.current) return;

      const resizeObserver = new ResizeObserver((entries) => {
         const height = entries[0].target.clientHeight;

         setMessageBoxHeight(height);
      });

      resizeObserver.observe(containerRef.current);

      const controller = new AbortController();

      window.addEventListener(
         "keydown",
         (e) => {
            if (e.key === "Escape" && currentEditingMessageId) {
               endEditMessage();
            }
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "dragover",
         (e) => {
            e.preventDefault();
         },
         { signal: controller.signal },
      );

      let dragCounter = 0;
      document.addEventListener(
         "dragenter",
         (e) => {
            e.preventDefault();
            dragCounter++;
            setDragging(true);
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "dragleave",
         (e) => {
            e.preventDefault();
            dragCounter--;
            if (dragCounter === 0) {
               setDragging(false);
            }
         },
         { signal: controller.signal },
      );

      document.addEventListener(
         "drop",
         (e) => {
            e.preventDefault();

            const files: AttachmentInputType[] = [];

            setDragging(false);
            dragCounter = 0;

            if (!e.dataTransfer?.files) {
               return;
            }

            for (const file of e.dataTransfer.files) {
               files.push({ name: file.name, type: file.type, arrayBuffer: async () => await file.arrayBuffer() });
            }

            addAttachments(files);
         },
         { signal: controller.signal },
      );

      return () => {
         resizeObserver.disconnect();
         controller.abort();
      };
   }, [currentEditingMessageId]);

   useEffect(() => {
      if (!currentEditingMessageId) {
         return;
      }

      const message = props.messages.find((x) => x.id === currentEditingMessageId);

      if (!message) {
         return;
      }

      editor.withoutNormalizing(() => {
         const lines = message.content.split("\n");
         editor.children = lines.map((x) => ({ type: "paragraph", children: [{ text: x }] }));
      });

      editor.normalize({ force: true });
      editor.select(editor.end([]));

      editorRef.current?.focus();
   }, [currentEditingMessageId]);

   return (
      <div className="bottom-0 z-10 flex-col px-5 py-1.5" ref={containerRef}>
         {currentEditingMessageId && (
            <div className="bg-primary-900 border-surface flex items-center gap-x-2 rounded-t-lg border-2 border-b-0 px-2 py-2 text-white">
               <IconMingcuteEdit2Fill />
               <div>Editing</div>
               <div className="text-sm text-white/50">(ESC to cancel)</div>
               <button className="bg-negative-100 hover:bg-negative-200 ml-auto cursor-pointer rounded-full p-1" onClick={endEditMessage}>
                  <IconMingcuteCloseFill className="size-4" />
               </button>
            </div>
         )}
         <DraggingIndicator isDragging={dragging} />
         <AttachmentsPreview attachments={attachments} onRemove={removeAttachment} />
         <form className="w-full">
            <div
               className={clsx(
                  "border-surface bg-surface-deep flex h-full items-start rounded-3xl border-2 transition-[border-radius]",
                  (attachments.length || currentEditingMessageId) && "rounded-t-none",
               )}
            >
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
                        placeholder={`Message ${channelName}`}
                        className={clsx(
                           "outline-hidden h-full whitespace-break-spaces py-3 font-light leading-[24px] text-white caret-white",
                           currentEditingMessageId && "pl-3",
                        )}
                        renderLeaf={renderLeaf}
                        renderElement={renderElement}
                        decorate={decorate}
                        onKeyDown={onEditorKeyDown}
                        renderPlaceholder={({ children, attributes }) => <div {...attributes}>{children}</div>}
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
         </form>
      </div>
   );
}
