import PickerMessage from "@components/PickerMessage";
import { useFileDialog } from "@hooks/useFileDialog";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { HuginnButton, HuginnInput, HuginnTab } from "@huginn/frontend-shared";
import { CONSTANTS, Errors, HuginnAPIError, toArrayBuffer, type APISticker } from "@huginnjs/shared";
import { getStickersOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useInfiniteQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type UIEvent } from "react";

export default function StickerPickerPanel(props: { onStickerSelect?: (sticker: APISticker) => void }) {
   const client = useClient();
   const { user } = useThisUser();
   const queryClient = useQueryClient();
   const { showError, updateModals } = useModals();
   const { open: openStickerContextMenu } = useContextMenu("sticker");
   const [tab, setTab] = useState("your");
   const [search, setSearch] = useState("");
   const { openFileDialog } = useFileDialog("image");
   const { register, values, setValue } = useHuginnForm<{ search: string }>({ defaultValues: { search: "" } });
   const inputSearch = values.search?.trim() ?? "";

   useEffect(() => {
      const timer = setTimeout(() => setSearch(inputSearch), 300);
      return () => clearTimeout(timer);
   }, [inputSearch]);

   const stickers = useInfiniteQuery(getStickersOptions(client, user?.id, tab, search));

   useEffect(() => {
      if (!stickers.error) return;
      const retry = stickers.isFetchNextPageError ? stickers.fetchNextPage : stickers.refetch;
      updateModals({
         info: {
            isOpen: true,
            status: "error",
            title: "Could not load stickers",
            text: stickers.error instanceof HuginnAPIError ? stickers.error.message : "Could not load stickers. Try again.",
            action: {
               confirm: {
                  text: "Try again",
                  callback: async () => {
                     updateModals({ info: { isOpen: false } });
                     await retry();
                  },
               },
            },
         },
      });
   }, [stickers.error, stickers.errorUpdatedAt, stickers.isFetchNextPageError, stickers.fetchNextPage, stickers.refetch, updateModals]);

   const upload = useMutation({
      mutationFn: (file: { data: ArrayBuffer; name: string; contentType: string }) => client!.stickers.upload(file),
      onSuccess: async () => {
         setValue("search", "");
         setSearch("");
         setTab("your");
         await queryClient.invalidateQueries({ queryKey: ["stickers", user?.id, "your"] });
      },
      onError: (error) => showError(error instanceof HuginnAPIError ? error.message : "Could not upload this sticker. Try again."),
   });
   const remove = useMutation({
      mutationFn: (id: string) => client!.stickers.delete(id),
      onSuccess: () => queryClient.invalidateQueries({ queryKey: ["stickers", user?.id, "your"] }),
      onError: (error) => showError(error instanceof HuginnAPIError ? error.message : "Could not delete this sticker. Try again."),
   });

   async function handleUpload() {
      const result = await openFileDialog();
      if (!result) return;
      const { file, dataUrl } = result;
      if (!file.size || file.size > CONSTANTS.STICKER_MAX_BYTES) {
         URL.revokeObjectURL(dataUrl);
         showError(!file.size ? Errors.invalidFileFormat()[0] : Errors.fileTooLarge(file.size, CONSTANTS.STICKER_MAX_BYTES)[0]);
         return;
      }
      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: dataUrl,
            mimeType: result.mimeType,
            cropType: "sticker",
            callback: async (croppedImage) => {
               const data = toArrayBuffer(croppedImage);
               if (!data.byteLength || data.byteLength > CONSTANTS.STICKER_MAX_BYTES) {
                  showError(!data.byteLength ? Errors.invalidFileFormat()[0] : Errors.fileTooLarge(data.byteLength, CONSTANTS.STICKER_MAX_BYTES)[0]);
                  return;
               }
               const isGif = result.mimeType === "image/gif";
               await upload
                  .mutateAsync({
                     data,
                     name: `${file.name.replace(/\.[^.]+$/, "")}.${isGif ? "gif" : "png"}`,
                     contentType: isGif ? "image/gif" : "image/png",
                  })
                  .catch(() => undefined);
            },
         },
      });
   }

   function handleScroll(event: UIEvent<HTMLDivElement>) {
      const target = event.currentTarget;
      if (target.scrollHeight - target.scrollTop - target.clientHeight < 80 && stickers.hasNextPage && !stickers.isFetchingNextPage) {
         void stickers.fetchNextPage();
      }
   }

   const items = stickers.data?.pages.flat() ?? [];
   return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden" data-ignore-swipe>
         <div className="flex items-center gap-2 p-2">
            <HuginnInput
               {...register("search")}
               placeholder={tab === "your" ? "Search your stickers..." : "Search in Klipy..."}
               className="w-full"
               autoFocus
            >
               <HuginnInput.Wrapper className="bg-surface-deep!">
                  <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                  <HuginnInput.Input data-keyboard-no-close maxLength={200} />
               </HuginnInput.Wrapper>
            </HuginnInput>
         </div>
         <div className="bg-surface-alt h-px shrink-0" />
         <HuginnTab value={tab} onChange={setTab} className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <HuginnTab.TabList className="gap-x-2 bg-transparent p-2 pb-0" tabClassName="py-1 w-full">
               <HuginnTab.Tab value="your">Your Stickers</HuginnTab.Tab>
               <HuginnTab.Tab value="all">All Stickers</HuginnTab.Tab>
            </HuginnTab.TabList>
            <HuginnTab.TabPanels className="flex min-h-0 flex-1 flex-col" panelClassName="flex min-h-0 flex-1 flex-col">
               <HuginnTab.TabPanel value={tab}>
                  <div className="scroll-super-thin min-h-0 flex-1 overflow-y-auto p-2" onScroll={handleScroll}>
                     <div className="grid grid-cols-3 gap-2">
                        {tab === "your" && (
                           <div className="flex aspect-square w-full items-center justify-center p-2">
                              <HuginnButton
                                 type="button"
                                 // title="Upload sticker"
                                 onClick={handleUpload}
                                 disabled={upload.isPending}
                                 color="primary"
                                 className="flex aspect-square w-full cursor-pointer items-center justify-center p-1"
                              >
                                 <IconMingcuteAddFill className="text-text size-10" />
                              </HuginnButton>
                           </div>
                        )}
                        {inputSearch === search &&
                           items.map((sticker) => (
                              <button
                                 key={`${sticker.source}:${sticker.id}`}
                                 type="button"
                                 title={sticker.title}
                                 onClick={() => props.onStickerSelect?.(sticker)}
                                 onContextMenu={
                                    tab === "your"
                                       ? (event) =>
                                            openStickerContextMenu(
                                               { sticker, onDelete: () => remove.mutateAsync(sticker.id).catch(() => undefined) },
                                               event,
                                            )
                                       : undefined
                                 }
                                 className="hover:bg-surface-alt flex aspect-square w-full cursor-pointer items-center justify-center rounded-md p-1"
                              >
                                 <img src={sticker.src} alt={sticker.title} loading="lazy" className="size-full object-contain" />
                              </button>
                           ))}
                     </div>
                     {!stickers.isPending && inputSearch === search && !stickers.isError && items.length === 0 && (
                        <PickerMessage>
                           {search
                              ? "No stickers found."
                              : tab === "your"
                                ? "Upload an image or GIF to create your first sticker."
                                : "No stickers available."}
                        </PickerMessage>
                     )}
                  </div>
               </HuginnTab.TabPanel>
            </HuginnTab.TabPanels>
         </HuginnTab>
      </div>
   );
}
