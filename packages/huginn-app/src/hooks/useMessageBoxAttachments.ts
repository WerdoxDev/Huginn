import type { ClipboardEvent } from "react";

import { isAudioMediaType, isImageMediaType, isVideoMediaType } from "@huginnjs/shared";
import { getAudioCovertArt, getVideoThumbnail } from "@lib/utils";
import { useEffect, useRef, useState, useTransition } from "react";

import type { AppAttachment, AttachmentInput } from "@/types";

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
            if (isImageMediaType(file.type)) {
               let previewDataUrl: string | undefined = file.previewDataUrl;

               if (!previewDataUrl) {
                  const reader = new FileReader();
                  reader.readAsDataURL(new Blob([await file.arrayBuffer()]));

                  previewDataUrl = await new Promise<string>((res, rej) => {
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
                  data: file.previewDataUrl ? file.arrayBuffer : await file.arrayBuffer(),
                  previewDataUrl: previewDataUrl,
                  contentType: file.type,
               });
            } else if (isVideoMediaType(file.type)) {
               const blob = new Blob([await file.arrayBuffer()]);
               const previewDataUrl = await getVideoThumbnail(blob, 1);

               pendingAttachments.push({
                  key: file.key,
                  filename: file.name,
                  data: file.previewDataUrl ? file.arrayBuffer : await file.arrayBuffer(),
                  previewDataUrl: previewDataUrl,
                  contentType: file.type,
               });
            } else if (isAudioMediaType(file.type)) {
               const blob = new Blob([await file.arrayBuffer()]);
               const previewDataUrl = await getAudioCovertArt(blob);

               pendingAttachments.push({
                  key: file.key,
                  filename: file.name,
                  data: file.previewDataUrl ? file.arrayBuffer : await file.arrayBuffer(),
                  previewDataUrl: previewDataUrl,
                  contentType: file.type,
               });
            } else {
               pendingAttachments.push({
                  key: file.key,
                  filename: file.name,
                  data: file.previewDataUrl ? file.arrayBuffer : await file.arrayBuffer(),
                  contentType: file.type,
                  previewDataUrl: file.previewDataUrl,
               });
            }
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
