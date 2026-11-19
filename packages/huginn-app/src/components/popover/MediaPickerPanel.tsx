import PickerMessage from "@components/PickerMessage";
import { useExpressions } from "@hooks/useExpressions";
import { useFileDialog } from "@hooks/useFileDialog";
import { HuginnButton, HuginnInput, HuginnTab } from "@huginn/frontend-shared";
import { CDNRoutes, CONSTANTS, ExpressionType, resolveCdnUrl, toArrayBuffer, type APIExpression, type ExpressionKind } from "@huginnjs/shared";
import { useClient, useClientStore } from "@stores/clientStore";
import { useContextMenu } from "@stores/contextMenuStore";
import { useModals } from "@stores/modalsStore";
import { useThisUser } from "@stores/userStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect, useMemo, useState, type ReactNode } from "react";

import GifPickerGrid from "./GifPickerGrid";

export default function MediaPickerPanel({
   kind,
   isOpen = true,
   onSelect,
}: {
   kind: ExpressionKind;
   isOpen?: boolean;
   onSelect?: (media: APIExpression) => void;
}) {
   const label = kind === "gifs" ? "GIFs" : "Stickers";
   const client = useClient();
   const { urls } = useClientStore();
   const { user } = useThisUser();
   const expressions = useExpressions(kind, isOpen);
   const { showError, updateModals } = useModals();
   const { openFileDialog } = useFileDialog(kind === "gifs" ? "gif" : "image");
   const { open: openGifMenu } = useContextMenu("gif");
   const { open: openStickerMenu } = useContextMenu("sticker");
   const [tab, setTab] = useState("your");
   // input is directly what user types
   const [input, setInput] = useState("");
   // search is debounced version of input every 300ms
   const [search, setSearch] = useState("");
   const [category, setCategory] = useState<{ name: string; isTrending: boolean } | null>(null);
   const showCategories = tab === "all" && !category && !search;

   const query = search || (category?.isTrending ? "" : (category?.name ?? ""));

   useEffect(() => {
      if (tab === "your" && search) {
         setTab("all");
      }
   }, [search]);

   useEffect(() => {
      const timer = setTimeout(() => setSearch(input.trim()), 300);
      return () => clearTimeout(timer);
   }, [input]);

   const categories = useQuery({
      queryKey: ["expression-categories", user?.id, kind],
      enabled: !!client && isOpen && showCategories,
      queryFn: async () => {
         if (kind === "gifs") {
            const result = await client!.gifs.getCategories();
            return { categories: result.categories, trending: result.trendingGif };
         }
         const result = await client!.stickers.getCategories();
         return { categories: result.categories, trending: result.trendingSticker };
      },
   });

   const browse = useInfiniteQuery({
      queryKey: ["expression-browse", user?.id, kind, query],
      enabled: !!client && isOpen && (tab === "all" || !!query) && !showCategories,
      queryFn: ({ pageParam }) => (query ? client![kind].search(query, 24, pageParam) : client![kind].getTrending(24, pageParam)),
      initialPageParam: 1,
      getNextPageParam: (page, _pages, pageParam) => (page.length < 24 ? undefined : pageParam + 1),
   });

   const items = useMemo(
      () =>
         !search
            ? tab === "your"
               ? expressions.items
               : (browse.data?.pages.flat() ?? [])
            : [...expressions.items, ...(browse.data?.pages.flat() ?? [])]
                 .filter((x) => x.title.toLowerCase().includes(search.toLowerCase()))
                 .reduce((acc, item) => {
                    if (!acc.find((x) => x.id === item.id && x.type === item.type)) acc.push(item);
                    return acc;
                 }, [] as APIExpression[]),
      [search, tab, browse.data, expressions],
   );

   console.log(items);

   // const items =
   //    tab === "your"
   //       ? expressions.items.filter((item) => item.title.toLowerCase().includes(search.toLowerCase()))
   //       : (browse.data?.pages.flat() ?? []);
   const loading = tab === "your" ? expressions.isLoading : showCategories ? categories.isPending : browse.isPending;
   const error = tab === "your" ? expressions.isError : showCategories ? categories.isError : browse.isError;

   function handleResetBrowse() {
      setCategory(null);
      setInput("");
      setSearch("");
   }

   function handleCategoryClick(name: string, trending = false) {
      setCategory({ name, isTrending: trending });
      if (!trending) setInput(name);
      setSearch("");
   }

   function getMediaSrc(item: APIExpression) {
      return resolveCdnUrl(item.type === ExpressionType.UPLOADED ? item.src : CDNRoutes.getExternal(item.src), urls!.cdn);
   }

   async function handleUploadClick() {
      const result = await openFileDialog();
      if (!result) return;

      const max = kind === "gifs" ? CONSTANTS.GIF_MAX_BYTES : CONSTANTS.STICKER_MAX_BYTES;
      if (!result.file.size || result.file.size > max) {
         URL.revokeObjectURL(result.dataUrl);
         showError(`Choose a file smaller than ${Math.floor(max / 1024 / 1024)} MB.`);
         return;
      }

      updateModals({
         imageCrop: {
            isOpen: true,
            originalImageData: result.dataUrl,
            mimeType: result.mimeType,
            cropType: kind === "gifs" ? "gif" : "sticker",
            callback: async (image) => {
               const data = toArrayBuffer(image);
               if (!data.byteLength || data.byteLength > max) {
                  showError(`Choose a file smaller than ${Math.floor(max / 1024 / 1024)} MB.`);
                  return;
               }

               try {
                  await expressions.upload({ data, name: result.file.name, contentType: image.slice(5, image.indexOf(";")) });
                  setInput("");
                  setSearch("");
                  setTab("your");
               } catch {}
            },
         },
      });
   }

   const createButton =
      tab === "your" ? (
         <div className="flex aspect-square w-full items-center justify-center p-2">
            <HuginnButton
               type="button"
               aria-label={kind === "gifs" ? "Upload GIF" : "Upload sticker"}
               color="primary"
               onClick={handleUploadClick}
               disabled={expressions.isPending}
               className="flex aspect-square w-full items-center justify-center p-1"
            >
               <IconMingcuteAddFill className="text-text size-10" />
            </HuginnButton>
         </div>
      ) : undefined;

   function renderItem(item: APIExpression) {
      const src = getMediaSrc(item);
      const isGif = kind === "gifs";
      const mediaClass = isGif ? "size-full object-cover" : "size-full object-contain";
      return (
         <div
            key={`${item.type}:${item.id}`}
            className={clsx(
               "group hover:bg-surface-alt relative flex items-center justify-center overflow-hidden rounded-md transition-colors",
               isGif ? "size-full" : "aspect-square w-full",
            )}
         >
            <button
               type="button"
               aria-label={item.title}
               className="hover:border-primary-700 active:border-primary-700 flex size-full cursor-pointer items-center justify-center overflow-hidden rounded-md border-2 border-transparent transition-[border]"
               onClick={() => onSelect?.(item)}
               onContextMenu={(event) => (kind === "gifs" ? openGifMenu(item, event) : openStickerMenu(item, event))}
            >
               {item.contentType.startsWith("video/") ? (
                  <video src={src} autoPlay={isOpen} muted loop playsInline className={mediaClass} />
               ) : (
                  <img src={src} alt={item.title} loading="lazy" className={mediaClass} />
               )}
            </button>
         </div>
      );
   }

   return (
      <div className="flex h-full min-h-0 w-full flex-col overflow-hidden" data-ignore-swipe>
         <div className="flex items-center gap-2 p-2">
            {tab === "all" && (category || search) && (
               <button className="size cursor-pointer p-2 text-white/70 hover:text-white" onClick={() => handleResetBrowse()}>
                  <IconMingcuteArrowLeftFill className="size-6" />
               </button>
            )}
            {!category?.isTrending ? (
               <HuginnInput
                  value={input}
                  onChange={(event) => {
                     setInput(event.target.value);
                     setCategory(null);
                  }}
                  placeholder={`Search ${label}...`}
                  className="min-w-0 flex-1"
               >
                  <HuginnInput.Wrapper className="bg-surface-deep!">
                     <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                     <HuginnInput.Input data-keyboard-no-close maxLength={200} />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            ) : (
               <div className="font-semibold text-white">Trending Gifs</div>
            )}
         </div>
         <div className="bg-surface-alt h-px w-full shrink-0" />
         <HuginnTab
            value={tab}
            onChange={(value) => {
               setTab(value);
               handleResetBrowse();
            }}
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
         >
            <HuginnTab.TabList className="gap-x-2 bg-transparent p-2" tabClassName="py-1 w-full">
               <HuginnTab.Tab value="your">
                  <IconMingcuteStarFill className="size-5" />
                  <span>Your {label}</span>
               </HuginnTab.Tab>
               <HuginnTab.Tab value="all">All {label}</HuginnTab.Tab>
            </HuginnTab.TabList>
            <HuginnTab.TabPanels className="flex min-h-0 flex-1 flex-col" panelClassName="flex min-h-0 flex-1 flex-col">
               <HuginnTab.TabPanel value={tab}>
                  <div
                     key={`${tab}:${showCategories ? "categories" : query}`}
                     className="scroll-super-thin min-h-0 flex-1 overflow-y-scroll p-2 pt-0 pr-0"
                     onScroll={(event) => {
                        const el = event.currentTarget;
                        if (
                           tab === "all" &&
                           !showCategories &&
                           el.scrollHeight - el.scrollTop - el.clientHeight < 80 &&
                           browse.hasNextPage &&
                           !browse.isFetchingNextPage
                        )
                           void browse.fetchNextPage();
                     }}
                  >
                     {showCategories ? (
                        <div className="grid grid-cols-2 gap-2">
                           <MediaCategory
                              className="col-span-2"
                              src={categories.data?.trending ? getMediaSrc(categories.data.trending) : undefined}
                              isVideo={categories.data?.trending?.contentType.startsWith("video/")}
                              isOpen={isOpen}
                              onClick={() => handleCategoryClick(`Trending ${label}`, true)}
                           >
                              <IconMingcuteTrendingUpFill className="size-5" />
                              <span>Trending</span>
                           </MediaCategory>
                           {categories.data?.categories.map((item) => (
                              <MediaCategory
                                 key={item.name}
                                 src={resolveCdnUrl(CDNRoutes.getExternal(item.src), urls!.cdn)}
                                 isOpen={isOpen}

                                 onClick={() => handleCategoryClick(item.name)}
                              >
                                 {item.name}
                              </MediaCategory>
                           ))}
                        </div>
                     ) : kind === "gifs" ? (
                        <GifPickerGrid gifs={items} createButton={createButton} renderGif={renderItem} />
                     ) : (
                        <div className="grid grid-cols-4 gap-2">
                           {createButton}
                           {items.map(renderItem)}
                        </div>
                     )}
                     {loading && <PickerMessage>Loading {label}…</PickerMessage>}
                     {error && (
                        <PickerMessage>
                           <button
                              type="button"
                              onClick={() =>
                                 void (tab === "your"
                                    ? expressions.refetch()
                                    : showCategories
                                      ? categories.refetch()
                                      : browse.isFetchNextPageError
                                        ? browse.fetchNextPage()
                                        : browse.refetch())
                              }
                           >
                              Could not load {label}. Try again.
                           </button>
                        </PickerMessage>
                     )}
                     {!showCategories && !loading && !error && items.length === 0 && (
                        <PickerMessage>
                           {tab === "all" || search ? "No results found." : `Upload or add ${label} from Klipy or messages.`}
                        </PickerMessage>
                     )}
                  </div>
               </HuginnTab.TabPanel>
            </HuginnTab.TabPanels>
         </HuginnTab>
      </div>
   );
}

function MediaCategory({
   src,
   isVideo = false,
   isOpen = true,
   className,
   children,
   onClick,
}: {
   src?: string;
   isVideo?: boolean;
   isOpen?: boolean;
   className?: string;
   children: ReactNode;
   onClick: () => void;
}) {
   return (
      <button
         type="button"
         className={clsx(
            "group hover:border-primary-700 active:border-primary-700 relative h-24 w-full cursor-pointer rounded-md border-2 border-transparent transition-[border] select-none",
            className,
         )}
         onClick={onClick}
      >
         {src &&
            (isVideo ? (
               <video src={src} autoPlay={isOpen} loop muted playsInline className="size-full rounded-md object-cover" />
            ) : (
               <img src={src} alt="" loading="lazy" className="size-full rounded-md object-cover" />
            ))}
         <div className="absolute inset-0 flex items-center justify-center gap-x-2 rounded-md bg-black/70 font-semibold text-white transition-[backdrop-filter] group-hover:backdrop-blur-sm group-active:backdrop-blur-sm">
            {children}
         </div>
      </button>
   );
}
