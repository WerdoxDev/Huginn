import { App } from "@capacitor/app";
import { Capacitor } from "@capacitor/core";
import LoadingIcon from "@components/LoadingIcon";
import { useCapacitorListener } from "@hooks/useCapacitorEvent";
import { useLookup } from "@hooks/useLookup";
import { Gallery, MediaType, type GalleryMediaItem, type ThumbnailResult } from "@lib/capacitor/gallery-plugin";
import { getMobileFilesOptions } from "@lib/queries";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { clsx } from "clsx";
import moment from "moment";
import { useCallback, useEffect, useState } from "react";

import type { AppAttachment, AttachmentInput } from "@/types";

export default function FilePickerPanel(props: {
   attachments: AppAttachment[];
   onAdd: (input: AttachmentInput[]) => void;
   onRemove: (key: string) => void;
}) {
   const queryClient = useQueryClient();
   const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailResult>>({});

   const attachmentsLookup = useLookup(props.attachments, (attachment) => attachment.key);

   const {
      data: mediaResult,
      fetchNextPage,
      isFetchingNextPage,
      hasNextPage,
   } = useInfiniteQuery({ ...getMobileFilesOptions(40), refetchOnMount: "always" });

   useCapacitorListener(() =>
      App.addListener("resume", () => {
         queryClient.invalidateQueries({ queryKey: ["mobile-files"] });
      }),
   );

   useEffect(() => {
      if (!mediaResult) return;

      let cancelled = false;

      for (const media of mediaResult.pages.flatMap((x) => x.media)) {
         if (thumbnails[media.id]) continue;
         Gallery.getMediaThumbnail({ id: media.id, uri: media.uri, size: 600, quality: 80 }).then((thumb) => {
            if (cancelled) return;
            setThumbnails((prev) => ({ ...prev, [media.id]: thumb }));
         });
      }

      return () => {
         cancelled = true;
      };
   }, [mediaResult]);

   useEffect(() => {
      return () => {
         queryClient.removeQueries({ queryKey: ["mobile-files"] });
      };
   }, [queryClient]);

   const handleScroll = useCallback(
      async (event: React.UIEvent<HTMLDivElement>) => {
         const scroller = event.currentTarget;
         const isAtBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 100;

         if (!isAtBottom || isFetchingNextPage || !hasNextPage) return;
         await fetchNextPage();
      },
      [fetchNextPage, hasNextPage, isFetchingNextPage],
   );

   function handleSelectFile(media: GalleryMediaItem) {
      if (attachmentsLookup[media.id]) {
         props.onRemove(attachmentsLookup[media.id].key);
      } else {
         props.onAdd([
            {
               key: media.id,
               name: media.name,
               type: media.mimeType,
               previewDataUrl: thumbnails[media.id]?.base64,
               async arrayBuffer() {
                  Capacitor.convertFileSrc(media.uri);
                  const res = await fetch(Capacitor.convertFileSrc(media.uri));
                  return await res.arrayBuffer();
               },
            },
         ]);
      }
   }

   return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden pb-2 pl-2">
         <div
            className="scroll-super-thin grid h-full w-full shrink-0 grid-cols-3 content-start items-start gap-2 overflow-y-auto pr-0"
            onScroll={handleScroll}
         >
            {mediaResult?.pages
               .flatMap((x) => x.media)
               .map((media) => (
                  <div className={clsx("aspect-square h-full w-full transition-transform", attachmentsLookup[media.id] && "scale-95")} key={media.id}>
                     <div className="bg-surface flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
                        {thumbnails[media.id] ? (
                           <div className="relative h-full w-full" onClick={() => handleSelectFile(media)}>
                              <img src={thumbnails[media.id].base64} alt={media.name} className="h-full w-full object-cover" />
                              <div className="absolute top-1.5 right-1.5">
                                 <div
                                    className={clsx(
                                       "flex size-5 items-center justify-center rounded-full border-2 transition-all",
                                       attachmentsLookup[media.id] ? "bg-primary-600 border-primary-600" : "border-white",
                                    )}
                                 >
                                    <IconMingcuteCheckFill
                                       className={clsx(
                                          "size-3 text-white transition-opacity",
                                          attachmentsLookup[media.id] ? "opacity-100" : "opacity-0",
                                       )}
                                    />
                                 </div>
                              </div>
                              {media.type === MediaType.VIDEO && (
                                 <div className="absolute bottom-1 left-1 flex items-center justify-center gap-x-1 rounded-md bg-black/50 px-1 py-0.5 text-sm text-white">
                                    <IconMingcutePlayFill className="size-4" />
                                    <div>{moment.utc(media.duration).format("mm:ss")}</div>
                                 </div>
                              )}
                           </div>
                        ) : (
                           <LoadingIcon className="size-10" />
                        )}
                     </div>
                  </div>
               ))}
         </div>
      </div>
   );
}
