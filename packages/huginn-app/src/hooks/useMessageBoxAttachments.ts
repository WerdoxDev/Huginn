import type { ClipboardEvent } from "react";

import { isImageMediaType } from "@huginn/shared";
import { useEffect, useRef, useState, useTransition } from "react";

import type { AppMessage, AppAttachment, AttachmentInput } from "@/types";

function getUniqueFilename(name: string, used: Set<string>) {
   if (!used.has(name)) {
      used.add(name);
      return name;
   }

   const dotIndex = name.lastIndexOf(".");
   const baseName = dotIndex >= 0 ? name.slice(0, dotIndex) : name;
   const extension = dotIndex >= 0 ? name.slice(dotIndex) : "";

   let counter = 1;
   let candidate = `${baseName} ${counter}${extension}`;
   while (used.has(candidate)) {
      counter++;
      candidate = `${baseName} ${counter}${extension}`;
   }

   used.add(candidate);
   return candidate;
}

export function useMessageBoxAttachments() {
   const [attachments, setAttachments] = useState<AppAttachment[]>([]);
   const [dragging, setDragging] = useState(false);
   const nextAttachmentKeyRef = useRef(0);
   const [_isPending, startTransition] = useTransition();

   async function addAttachments(input: AttachmentInput[]) {
      startTransition(async () => {
         const pendingAttachments: Array<Omit<AppAttachment, "key"> & { key?: string }> = [];

         for (const file of input) {
            const arrayBuffer = await file.arrayBuffer();
            if (!isImageMediaType(file.type)) {
               pendingAttachments.push({
                  key: file.key,
                  filename: file.name,
                  data: arrayBuffer,
                  contentType: file.type,
                  previewDataUrl: file.previewDataUrl,
               });
               continue;
            }

            let dataUrl: string | undefined = file.previewDataUrl;

            if (!dataUrl) {
               const reader = new FileReader();
               reader.readAsDataURL(new Blob([arrayBuffer]));

               dataUrl = await new Promise<string>((res, rej) => {
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
            }

            pendingAttachments.push({
               key: file.key,
               filename: file.name,
               data: arrayBuffer,
               previewDataUrl: dataUrl,
               contentType: file.type,
            });
         }

         setAttachments((currentAttachments) => {
            const usedNames = new Set(currentAttachments.map((attachment) => attachment.filename));
            const newAttachments: AppAttachment[] = [...currentAttachments];

            for (const pendingAttachment of pendingAttachments) {
               const filename = getUniqueFilename(pendingAttachment.filename, usedNames);
               const key = pendingAttachment.key ?? (nextAttachmentKeyRef.current++).toString();
               newAttachments.push({
                  key,
                  filename,
                  data: pendingAttachment.data,
                  previewDataUrl: pendingAttachment.previewDataUrl,
                  contentType: pendingAttachment.contentType,
               });
            }
            console.log(newAttachments);

            return newAttachments;
         });
      });
   }

   function openFileSelector() {
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

   function removeAttachment(key: string) {
      setAttachments((old) => old.filter((x) => x.key !== key));
   }

   function clearAttachments() {
      setAttachments([]);
      nextAttachmentKeyRef.current = 0;
   }

   function onPaste(e: ClipboardEvent) {
      addAttachments(Array.from(e.clipboardData.files));
   }

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

            const files: AttachmentInput[] = Array.from(e.dataTransfer.files).map((file) => ({
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

   return { attachments, dragging, openFileSelector, removeAttachment, addAttachments, clearAttachments, onPaste };
}
