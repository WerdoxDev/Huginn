import { Drawer } from "@base-ui/react";
import { Capacitor } from "@capacitor/core";
import HuginnButton from "@components/button/HuginnButton";
import { DrawerBackdrop, DrawerPopup } from "@components/Drawer";
import HuginnLabel from "@components/HuginnLabel";
import HuginnTab from "@components/HuginnTab";
import LoadingIcon from "@components/LoadingIcon";
import PickerMessage from "@components/PickerMessage";
import { useClearQueryData } from "@hooks/useClearQueryData";
import { useIsInView } from "@hooks/useIsInView";
import { useLookup } from "@hooks/useLookup";
import { Files, type FileItem } from "@lib/capacitor/files-plugin";
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
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { AndroidSettings, IOSSettings, NativeSettings } from "capacitor-native-settings";
import { clsx } from "clsx";
import moment from "moment";
import { useCallback, useEffect, useMemo, useRef, useState, type RefObject } from "react";
import { createPortal } from "react-dom";

import type { AppAttachment, AttachmentInput } from "@/types";

export default function FilePickerDrawer(props: {
   attachments: AppAttachment[];
   onAdd: (input: AttachmentInput[]) => void;
   onRemove: (key: string) => void;
   keyboardHeight: number;
   isOpen: boolean;
   onOpenChange?: (open: boolean) => void;
}) {
   const snapPoints = useMemo(() => [props.keyboardHeight, 1], [props.keyboardHeight]);
   const [snapPoint, setSnapPoint] = useState<number | string | null>(snapPoints[0]);
   const canScroll = snapPoint === snapPoints.at(-1);

   useEffect(() => {
      if (!props.isOpen) {
         setSnapPoint(snapPoints[0]);
      }
   }, [props.isOpen]);

   useEffect(() => {
      setSnapPoint(snapPoints[0]);
   }, [snapPoints]);

   return (
      <Drawer.Root
         disablePointerDismissal={!canScroll}
         modal={false}
         snapPoints={snapPoints}
         onSnapPointChange={setSnapPoint}
         snapPoint={snapPoint}
         open={props.isOpen}
         onOpenChange={props.onOpenChange}
      >
         <Drawer.Portal>
            <DrawerBackdrop passThrough={!canScroll} />
            <DrawerPopup
               className="h-full [--file-picker-drawer-y:calc(var(--drawer-snap-point-offset)+var(--drawer-swipe-movement-y))]"
               passThrough={!canScroll}
            >
               <FilePickerPanel
                  attachments={props.attachments}
                  onAdd={props.onAdd}
                  onRemove={props.onRemove}
                  canScroll={canScroll}
                  isOpen={props.isOpen}
               />
            </DrawerPopup>
         </Drawer.Portal>
      </Drawer.Root>
   );
}

function FilePickerPanel(props: {
   attachments: AppAttachment[];
   onAdd: (input: AttachmentInput[]) => void;
   onRemove: (key: string) => void;
   canScroll?: boolean;
   isOpen: boolean;
}) {
   const [activeTab, setActiveTab] = useState<"media" | "files">("media");
   const [areTabsVisible, setAreTabsVisible] = useState(true);
   const lastScrollTopRef = useRef<Record<"media" | "files", number>>({ media: 0, files: 0 });

   useEffect(() => {
      if (props.canScroll) return;

      setAreTabsVisible(true);
   }, [props.canScroll]);

   const handleTabChange = useCallback((value: string) => {
      if (value !== "media" && value !== "files") return;

      setActiveTab(value);
      setAreTabsVisible(true);
   }, []);

   const handlePanelScroll = useCallback((tab: "media" | "files", scrollTop: number) => {
      const scrollDelta = scrollTop - lastScrollTopRef.current[tab];
      if (Math.abs(scrollDelta) < 8) return;

      setAreTabsVisible(scrollTop <= 8 || scrollDelta < 0);
      lastScrollTopRef.current[tab] = scrollTop;
   }, []);

   const handleMediaScroll = useCallback((scrollTop: number) => handlePanelScroll("media", scrollTop), [handlePanelScroll]);
   const handleFilesScroll = useCallback((scrollTop: number) => handlePanelScroll("files", scrollTop), [handlePanelScroll]);

   return (
      <HuginnTab value={activeTab} onChange={handleTabChange} className="relative h-full min-h-0 w-full overflow-hidden">
         <HuginnTab.TabPanels className="h-full min-h-0 w-full" panelClassName="h-full min-h-0 w-full">
            <HuginnTab.TabPanel value="media">
               <MediaPickerPanel {...props} onScroll={handleMediaScroll} />
            </HuginnTab.TabPanel>
            <HuginnTab.TabPanel value="files">
               <FilesPanel
                  attachments={props.attachments}
                  onAdd={props.onAdd}
                  onRemove={props.onRemove}
                  canScroll={props.canScroll}
                  onScroll={handleFilesScroll}
               />
            </HuginnTab.TabPanel>
         </HuginnTab.TabPanels>
         {createPortal(
            <div
               className={clsx(
                  "pointer-events-none fixed inset-x-0 bottom-5 z-20 flex justify-center px-4 transition-all duration-200",
                  props.isOpen && areTabsVisible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0",
               )}
            >
               <HuginnTab.TabList
                  className="bg-surface-alt border-surface pointer-events-auto border backdrop-blur-sm"
                  tabClassName="h-10 flex justify-center items-center py-1 w-28"
               >
                  <HuginnTab.Tab value="media">
                     <IconMingcutePhotoAlbum2Fill className="size-5" />
                     Media
                  </HuginnTab.Tab>
                  <HuginnTab.Tab value="files">
                     <IconMingcuteFileFill className="size-5" />
                     Files
                  </HuginnTab.Tab>
               </HuginnTab.TabList>
            </div>,
            document.body,
         )}
      </HuginnTab>
   );
}

function FilesPanel(props: {
   attachments: AppAttachment[];
   onAdd: (input: AttachmentInput[]) => void;
   onRemove: (key: string) => void;
   canScroll?: boolean;
   onScroll: (scrollTop: number) => void;
}) {
   const scrollRef = useRef<HTMLDivElement>(null);
   const attachmentsLookup = useLookup(props.attachments, (attachment) => attachment.key);
   const {
      data,
      error,
      isPending,
      refetch: refetchRecentFiles,
   } = useQuery({
      queryKey: ["recent-device-files"],
      queryFn: async () => await Files.getRecentFiles({ limit: 40 }),
      refetchOnMount: "always",
      retry: false,
   });

   function getAttachmentInput(file: FileItem, previewDataUrl?: string): AttachmentInput {
      return {
         key: file.uri,
         name: file.name,
         type: file.mimeType,
         previewDataUrl,
         async arrayBuffer() {
            const response = await fetch(Capacitor.convertFileSrc(file.uri));
            if (!response.ok) throw new Error(`Failed to read ${file.name}`);
            return await response.arrayBuffer();
         },
      };
   }

   function handleSelectFile(file: FileItem, previewDataUrl?: string) {
      if (attachmentsLookup[file.uri]) {
         props.onRemove(file.uri);
      } else {
         props.onAdd([getAttachmentInput(file, previewDataUrl)]);
      }
   }

   async function handleBrowseFiles() {
      const result = await Files.pickFiles({ multiple: true });
      const newFiles = result.files.filter((file) => !attachmentsLookup[file.uri]);
      if (newFiles.length > 0) props.onAdd(newFiles.map((file) => getAttachmentInput(file)));
      await refetchRecentFiles();
   }

   return (
      <div className="flex h-full min-h-0 w-full flex-col gap-y-2 overflow-hidden pt-2">
         <div className="px-2">
            <HuginnButton color="primary" onClick={handleBrowseFiles} className="flex w-full shrink-0 items-center justify-center gap-x-2 py-2">
               <IconMingcuteFolderOpenFill className="size-5" />
               Browse files
            </HuginnButton>
         </div>
         <div className="flex flex-col gap-y-2 overflow-hidden pl-2">
            {data && data.files.length > 0 && <HuginnLabel className="mb-0! ml-1">Recent files</HuginnLabel>}
            <div
               ref={scrollRef}
               className={clsx(
                  "scroll-super-thin flex min-h-0 flex-1 flex-col gap-y-1 pb-16",
                  props.canScroll ? "overflow-y-auto pr-0" : "overflow-hidden pr-2",
               )}
               onScroll={(event) => props.onScroll(event.currentTarget.scrollTop)}
            >
               {isPending ? (
                  <PickerMessage icon={<LoadingIcon className="size-8" />}>Loading recent files…</PickerMessage>
               ) : error ? (
                  <PickerMessage icon={<IconMingcuteSadFill className="size-8" />}>
                     Recent files could not be loaded. You can still browse for a file.
                  </PickerMessage>
               ) : data.files.length === 0 ? (
                  <PickerMessage icon={<IconMingcuteFileFill className="size-8" />}>
                     Files you choose will appear here for quick access.
                  </PickerMessage>
               ) : (
                  data.files.map((file) => (
                     <FileRow
                        key={file.uri}
                        file={file}
                        isSelected={!!attachmentsLookup[file.uri]}
                        scrollRef={scrollRef}
                        onSelect={handleSelectFile}
                     />
                  ))
               )}
            </div>
         </div>
      </div>
   );
}

function FileRow(props: {
   file: FileItem;
   isSelected: boolean;
   scrollRef: RefObject<HTMLDivElement | null>;
   onSelect: (file: FileItem, previewDataUrl?: string) => void;
}) {
   const ref = useRef<HTMLButtonElement>(null);
   const hasFetchedThumbnail = useRef(false);
   const [thumbnail, setThumbnail] = useState<string>();
   const isInView = useIsInView(ref, props.scrollRef);
   const mimeType = props.file.mimeType.toLowerCase();
   const isImage = mimeType.startsWith("image/");
   const isVideo = mimeType.startsWith("video/");
   const isAudio = mimeType.startsWith("audio/");

   useEffect(() => {
      if (!isInView || hasFetchedThumbnail.current || (!isImage && !isVideo)) return;

      hasFetchedThumbnail.current = true;
      let cancelled = false;

      Gallery.getMediaThumbnail({ uri: props.file.uri, size: 160, quality: 80 })
         .then((result) => {
            if (cancelled || "error" in result || !result.base64) return;
            setThumbnail(result.base64);
         })
         .catch(() => {
            // A provider may not support thumbnails. The media-specific icon remains as a fallback.
         });

      return () => {
         cancelled = true;
      };
   }, [isImage, isInView, isVideo, props.file.uri]);

   return (
      <button
         ref={ref}
         type="button"
         className={clsx(
            "flex w-full items-center gap-x-2 rounded-lg px-2 py-2 text-left transition-all",
            props.isSelected ? "bg-primary-900 scale-95" : "bg-surface-deep",
         )}
         onClick={() => props.onSelect(props.file, thumbnail)}
         data-keyboard-no-close
      >
         {thumbnail ? (
            <div className="relative size-10 overflow-hidden rounded-sm">
               <img className="h-full w-full object-cover" loading="lazy" src={thumbnail} alt="" />
               {isVideo && (
                  <div className="absolute bottom-0.5 left-0.5 rounded bg-black/70 p-0.5">
                     <IconMingcuteVideoFill className="size-3.5 text-white" />
                  </div>
               )}
            </div>
         ) : isVideo ? (
            <IconMingcuteVideoFill className="text-text size-10" />
         ) : isAudio ? (
            <IconMingcuteFileMusicFill className="text-text size-10" />
         ) : (
            <IconMingcuteFileFill className="text-text size-10" />
         )}
         <div className="min-w-0 flex-1">
            <div className="text-text truncate text-sm font-medium">{props.file.name}</div>
            <div className="text-text/50 truncate text-xs">{getFileMetadata(props.file)}</div>
         </div>
         <div
            className={clsx(
               "flex size-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
               props.isSelected ? "bg-primary-600 border-primary-600" : "border-white",
            )}
         >
            <IconMingcuteCheckFill className={clsx("size-3 text-white transition-opacity", props.isSelected ? "opacity-100" : "opacity-0")} />
         </div>
      </button>
   );
}

function getFileMetadata(file: FileItem) {
   const parts: string[] = [];

   const extension = file.name.split(".").pop()?.toUpperCase();
   if (extension) {
      parts.push(`${extension} File`);
   }

   if (file.size > 0) {
      const units = ["B", "KB", "MB", "GB"];
      const unitIndex = Math.min(Math.floor(Math.log(file.size) / Math.log(1024)), units.length - 1);
      const value = file.size / 1024 ** unitIndex;
      parts.push(`${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`);
   }

   if (file.modifiedAt > 0) parts.push(moment(file.modifiedAt).fromNow());
   return parts.join(" - ") || file.mimeType;
}

function MediaPickerPanel(props: {
   attachments: AppAttachment[];
   onAdd: (input: AttachmentInput[]) => void;
   onRemove: (key: string) => void;
   canScroll?: boolean;
   onScroll: (scrollTop: number) => void;
}) {
   const [thumbnails, setThumbnails] = useState<Record<string, ThumbnailResult>>({});
   const { updateModals } = useModals();
   const [permissionState, setPermissionState] = useState<MediaPermissionState | null>(null);
   const scrollRef = useRef<HTMLDivElement>(null);
   useClearQueryData(["mobile-files"], { keepFirstPage: true, clearOnUnmount: true });

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

   const handleScroll = useCallback(
      async (event: React.UIEvent<HTMLDivElement>) => {
         const scroller = event.currentTarget;
         props.onScroll(scroller.scrollTop);
         const isAtBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= 100;

         if (!isAtBottom || isFetchingNextPage || !hasNextPage) return;
         await fetchNextPage();
      },
      [fetchNextPage, hasNextPage, isFetchingNextPage, props.onScroll],
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

   const handleThumbnailReady = useCallback((id: string, result: ThumbnailResult) => {
      setThumbnails((prev) => ({ ...prev, [id]: result }));
   }, []);

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
               <div
                  className={clsx(
                     "scroll-super-thin flex h-full w-full flex-col pb-16",
                     props.canScroll ? "overflow-y-scroll pr-0" : "overflow-hidden pr-2",
                  )}
                  ref={scrollRef}
                  onScroll={handleScroll}
               >
                  <div className="relative grid w-full grid-cols-3 content-start items-start gap-2">
                     {mediaResult?.pages
                        .flatMap((x) => x.media)
                        .map((media) => (
                           <MediaGridItem
                              key={media.id}
                              media={media}
                              scrollRef={scrollRef}
                              thumbnail={thumbnails[media.id]}
                              isSelected={!!attachmentsLookup[media.id]}
                              onSelect={handleSelectFile}
                              onThumbnailReady={handleThumbnailReady}
                           />
                        ))}
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

function MediaGridItem(props: {
   media: GalleryMediaItem;
   thumbnail: ThumbnailResult | undefined;
   isSelected: boolean;
   scrollRef: RefObject<HTMLDivElement | null>;
   onSelect: (media: GalleryMediaItem) => void;
   onThumbnailReady: (id: string, result: ThumbnailResult) => void;
}) {
   const ref = useRef<HTMLDivElement>(null);
   const isFetched = useRef(false);

   const isInView = useIsInView(ref, props.scrollRef);

   // useEffect(() => {
   //    const el = ref.current;
   //    if (!el) return;

   //    const observer = new IntersectionObserver(
   //       (entries) => {
   //          const entry = entries[0];
   //          if (!entry.isIntersecting || fetchedRef.current || props.thumbnail) return;

   //          fetchedRef.current = true;
   //          observer.disconnect();

   //          Gallery.getMediaThumbnail({ id: props.media.id, uri: props.media.uri, size: 600, quality: 80 }).then((result) => {
   //             if ("error" in result) return;
   //             props.onThumbnailReady(props.media.id, result);
   //          });
   //       },
   //       {
   //          root: props.scrollRef?.current,
   //          threshold: 0.1, // trigger as soon as 10% of the item is visible
   //       },
   //    );

   //    observer.observe(el);
   //    return () => observer.disconnect();
   // }, [props.media.id, props.media.uri, props.thumbnail, props.onThumbnailReady]);

   useEffect(() => {
      if (!isInView || isFetched.current) return;

      Gallery.getMediaThumbnail({ id: props.media.id, uri: props.media.uri, size: 600, quality: 80 }).then((result) => {
         if ("error" in result) return;
         isFetched.current = true;
         props.onThumbnailReady(props.media.id, result);
      });
   }, [isInView, props.media.id, props.media.uri, props.thumbnail, props.onThumbnailReady]);

   const handleClick = useCallback(() => props.onSelect(props.media), [props.media, props.onSelect]);

   return (
      <div ref={ref} className={clsx("aspect-square h-full w-full transition-transform", props.isSelected && "scale-95")}>
         <div className="bg-surface relative flex h-full w-full items-center justify-center overflow-hidden rounded-lg">
            <div className="relative h-full w-full" onClick={handleClick}>
               {props.thumbnail && <img src={props.thumbnail.base64} alt={props.media.name} className="h-full w-full object-cover" />}
               {/* <LoadingBackground isLoaded={!!props.thumbnail} hasError={false} /> */}
               <div className="absolute top-1.5 right-1.5">
                  <div
                     className={clsx(
                        "flex size-5 items-center justify-center rounded-full border-2 transition-all",
                        props.isSelected ? "bg-primary-600 border-primary-600" : "border-white",
                     )}
                  >
                     <IconMingcuteCheckFill
                        className={clsx("size-3 text-white transition-opacity", props.isSelected ? "opacity-100" : "opacity-0")}
                     />
                  </div>
               </div>
               {props.media.type === MediaType.VIDEO && (
                  <div className="absolute bottom-1 left-1 flex items-center justify-center gap-x-1 rounded-md bg-black/50 px-1 py-0.5 text-sm text-white">
                     <IconMingcutePlayFill className="size-4" />
                     <div>{moment.utc(props.media.duration).format("mm:ss")}</div>
                  </div>
               )}
            </div>
         </div>
      </div>
   );
}
