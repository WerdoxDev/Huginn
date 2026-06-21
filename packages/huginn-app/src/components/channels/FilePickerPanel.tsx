import { Capacitor } from "@capacitor/core";
import HuginnButton from "@components/button/HuginnButton";
import LoadingBackground from "@components/LoadingBackground";
import LoadingIcon from "@components/LoadingIcon";
import { useLookup } from "@hooks/useLookup";
import {
   Gallery,
   GalleryErrorCode,
   MediaType,
   type GalleryMediaItem,
   type MediaPermissionState,
   type ThumbnailResult,
} from "@lib/capacitor/gallery-plugin";
import { getMobileFilesOptions } from "@lib/queries";
import { useModals } from "@stores/modalsStore";
import { useInfiniteQuery, useQueryClient } from "@tanstack/react-query";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
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
   const { updateModals } = useModals();
   const [permissionState, setPermissionState] = useState<MediaPermissionState | null>(null);

   const attachmentsLookup = useLookup(props.attachments, (attachment) => attachment.key);

   const {
      data: mediaResult,
      fetchNextPage,
      isFetchingNextPage,
      hasNextPage,
      error,
      refetch,
   } = useInfiniteQuery({
      ...getMobileFilesOptions(40),
      refetchOnMount: "always",
      retry: false,
      refetchOnWindowFocus: "always",
      enabled: !!permissionState,
   });

   useEffect(() => {
      if (!mediaResult) return;

      let cancelled = false;

      for (const media of mediaResult.pages.flatMap((x) => x.media)) {
         if (thumbnails[media.id]) continue;
         Gallery.getMediaThumbnail({ id: media.id, uri: media.uri, size: 600, quality: 80 }).then((result) => {
            if ("error" in result) return;
            if (cancelled) return;
            setThumbnails((prev) => ({ ...prev, [media.id]: result }));
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

   useEffect(() => {
      requestPermission(false);
   }, []);

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

   async function requestPermission(skipPartial: boolean) {
      const result = await Gallery.checkOrRequestPermission({ skipPartial });
      setPermissionState(result.status);

      if (result.settingsRequired) {
         updateModals({
            info: {
               isOpen: true,
               title: "Settings needed",
               text: "We couldn't ask you for permission again. Please allow permission from app settings.",
               status: "error",
               action: {
                  confirm: {
                     text: "Open settings",
                     callback: async () => {
                        await openAppSettings();
                        updateModals({ info: { isOpen: false } });
                     },
                  },
               },
            },
         });
      } else {
         refetch();
      }
   }

   async function openAppSettings() {
      await NativeSettings.open({ optionAndroid: AndroidSettings.ApplicationDetails, optionIOS: IOSSettings.App });
   }

   return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden pb-2 pl-2">
         {error ? (
            <div className="text-text/70 flex h-full w-full flex-col items-center justify-center gap-2 text-center">
               <IconMingcuteSadFill className="size-10" />
               {error.message === GalleryErrorCode.DENIED_ONCE ? (
                  <>
                     <div>Permission is required to access files</div>
                     <HuginnButton color="primary" onClick={() => requestPermission(false)} className="px-2 py-1">
                        Ask for permission
                     </HuginnButton>
                  </>
               ) : (
                  <>
                     <div>Permission was permanently denied. Please allow permission from app settings.</div>
                     <HuginnButton color="primary" onClick={() => openAppSettings()} className="px-2 py-1">
                        Open settings
                     </HuginnButton>
                  </>
               )}
            </div>
         ) : (
            <>
               <div className="scroll-super-thin flex h-full w-full flex-col overflow-y-auto pr-0" onScroll={handleScroll}>
                  <div className="relative grid w-full grid-cols-3 content-start items-start gap-2">
                     {mediaResult?.pages
                        .flatMap((x) => x.media)
                        .map((media) => (
                           <div
                              className={clsx("aspect-square h-full w-full transition-transform", attachmentsLookup[media.id] && "scale-95")}
                              key={media.id}
                           >
                              <div className="bg-surface relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
                                 <div className="relative h-full w-full" onClick={() => handleSelectFile(media)}>
                                    {thumbnails[media.id] && (
                                       <img src={thumbnails[media.id].base64} alt={media.name} className="h-full w-full object-cover" />
                                    )}
                                    <LoadingBackground isLoaded={!!thumbnails[media.id]} hasError={false} />
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
                              </div>
                           </div>
                        ))}
                     <LoadingBackground isLoaded={!!mediaResult} hasError={false} />
                  </div>
                  {permissionState === "partial" && (
                     <div className="flex shrink-0 flex-col items-center justify-center gap-y-2 px-10 py-5 text-center">
                        <div className="text-text/70">Limited access was given. If you want more photos, change the app permission.</div>
                        <HuginnButton color="primary" onClick={() => requestPermission(true)} className="px-2 py-1">
                           Change permission
                        </HuginnButton>
                     </div>
                  )}
               </div>
            </>
         )}
      </div>
   );
}
