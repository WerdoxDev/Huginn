import type { ClipboardEvent } from "react";

import { isImageMediaType } from "@huginn/shared";
import { useEffect, useState, useTransition } from "react";

import type { AppMessage, AttachmentType } from "@/types";

type AttachmentInputType = { name: string; type: string; arrayBuffer: () => Promise<ArrayBuffer> };

export function useMessageBoxAttachments(editorRef: React.RefObject<HTMLDivElement | null>, messages: AppMessage[]) {
   const [attachments, setAttachments] = useState<AttachmentType[]>([]);
   const [dragging, setDragging] = useState(false);
   const [_isPending, startTransition] = useTransition();

   async function addAttachments(input: AttachmentInputType[]) {
      startTransition(async () => {
         const newAttachments: AttachmentType[] = [];
         for (const [i, file] of input.entries()) {
            const arrayBuffer = await file.arrayBuffer();
            if (!isImageMediaType(file.type)) {
               newAttachments.push({
                  id: i,
                  arrayBuffer: arrayBuffer,
                  dataUrl: undefined,
                  filename: file.name,
                  contentType: file.type,
               });
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

            newAttachments.push({
               id: i,
               arrayBuffer: arrayBuffer,
               dataUrl: dataUrl,
               filename: file.name,
               contentType: file.type,
            });
         }

         setAttachments(newAttachments);
         editorRef.current?.focus();
      });
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

   function removeAttachment(id: number) {
      setAttachments((old) => old.filter((x) => x.id !== id));
   }

   function clearAttachments() {
      setAttachments([]);
   }

   function onPaste(e: ClipboardEvent) {
      addAttachments(Array.from(e.clipboardData.files));
   }

   // // Sync attachment clearing with new preview message rendering
   // useEffect(() => {
   //    setAttachments([]);
   // }, [messages]);

   // Drag-and-drop event listeners
   useEffect(() => {
      const controller = new AbortController();
      let dragCounter = 0;

      document.addEventListener("dragover", (e) => e.preventDefault(), { signal: controller.signal });

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
            setDragging(false);
            dragCounter = 0;

            if (!e.dataTransfer?.files) return;

            const files: AttachmentInputType[] = Array.from(e.dataTransfer.files).map((file) => ({
               name: file.name,
               type: file.type,
               arrayBuffer: async () => await file.arrayBuffer(),
            }));

            addAttachments(files);
         },
         { signal: controller.signal },
      );

      return () => controller.abort();
   }, []);

   return { attachments, dragging, addFiles, removeAttachment, clearAttachments, onPaste };
}
