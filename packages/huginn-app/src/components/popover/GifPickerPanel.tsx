import type { APIGif, FavoriteGif } from "@huginn/shared";

import HuginnTab from "@components/HuginnTab";
import HuginnInput from "@components/input/HuginnInput";
import LoadingIcon from "@components/LoadingIcon";
import { useClearQueryData } from "@hooks/useClearQueryData";
import { useContainerWidth } from "@hooks/useContainerWidth";
import { useDebouncer } from "@hooks/useDebouncer";
import { useFavoriteGifs } from "@hooks/useFavoriteGifs";
import { useHuginnForm } from "@hooks/useHuginnForm";
import { useIsMobile } from "@hooks/useIsMobile";
import { getGifCategoriesOptions, getSearchGifsOptions, getTrendingGifsOptions } from "@lib/queries";
import { useClient } from "@stores/clientStore";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { clsx } from "clsx";
import { useCallback, useEffect, useMemo, useState, type CSSProperties, type ReactNode, type UIEvent } from "react";

type Input = {
   search: string;
};

const FETCH_SCROLL_THRESHOLD = 60;

function useGifs(category: string | null, query: string) {
   const client = useClient();

   const {
      data: trendingGifs,
      isFetchingNextPage: trendingIsFetchingNextPage,
      hasNextPage: trendingHasNextPage,
      fetchNextPage: trendingFetchNextPage,
      isLoading: trendingIsLoading,
   } = useInfiniteQuery({ ...getTrendingGifsOptions(client!), enabled: category === "trending" });

   const {
      data: searchGifs,
      isFetchingNextPage: searchIsFetchingNextPage,
      hasNextPage: searchHasNextPage,
      fetchNextPage: searchFetchNextPage,
      isLoading: searchIsLoading,
   } = useInfiniteQuery({ ...getSearchGifsOptions(client!, query), enabled: !!query && category !== "trending" });

   return category === "trending"
      ? {
           gifs: trendingGifs?.pages.flatMap((page) => page) ?? [],
           isFetchingNextPage: trendingIsFetchingNextPage,
           isLoading: trendingIsLoading,
           hasNextPage: trendingHasNextPage,
           fetchNextPage: trendingFetchNextPage,
        }
      : {
           gifs: searchGifs?.pages.flatMap((page) => page) ?? [],
           isLoading: searchIsLoading,
           isFetchingNextPage: searchIsFetchingNextPage,
           hasNextPage: searchHasNextPage,
           fetchNextPage: searchFetchNextPage,
        };
}

export default function GifPickerPanel(props: { isOpen?: boolean; onGifSelect?: (url: string) => void }) {
   const client = useClient();
   const { favoriteGifs, toggleFavorite } = useFavoriteGifs();
   const [category, setCategory] = useState<string | null>();
   const [search, setSearch] = useState<string>("");
   const [selectedTab, setSelectedTab] = useState<string>("your");
   const cleanTrendingQuery = useClearQueryData(["trending-gifs"], { keepFirstPage: true, clearOnUnmount: true });
   const cleanSearchQuery = useClearQueryData(["search-gifs"], { keepFirstPage: true, clearOnUnmount: true });

   const { data } = useQuery(getGifCategoriesOptions(client!));
   const { register, values, setValue } = useHuginnForm<Input>();

   const { gifs, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useGifs(category ?? null, search);
   const isMobile = useIsMobile();

   const { debouncedFunction } = useDebouncer((search: string) => {
      cleanSearchQuery();
      setSearch(search);
   }, 300);

   useEffect(() => {
      if (values.search) {
         debouncedFunction(values.search);
         setSelectedTab("all");
      }
   }, [values.search]);

   function handleSelectCategory(category: string | null) {
      if (category === "trending") cleanTrendingQuery();
      setCategory(category);
      setValue("search", category ?? "");
   }

   function handleSelectTab(tab: string) {
      setSelectedTab(tab);
      handleSelectCategory(null);
   }

   const handleScroll = useCallback(
      async (event: UIEvent<HTMLDivElement>) => {
         const scroller = event.currentTarget;
         const isAtBottom = scroller.scrollHeight - scroller.scrollTop - scroller.clientHeight <= FETCH_SCROLL_THRESHOLD;

         if (!isAtBottom || isFetchingNextPage || !hasNextPage) return;
         await fetchNextPage();
      },
      [fetchNextPage, hasNextPage, isFetchingNextPage],
   );

   function handleSelectGif(gif: FavoriteGif) {
      props.onGifSelect?.(gif.url);
      toggleFavorite({ url: gif.url, src: gif.src, height: gif.height, width: gif.width });
   }

   return (
      <div className={clsx("flex h-full w-full flex-col overflow-hidden", isMobile && "rounded-t-xl bg-zinc-900")} data-ignore-swipe>
         <div className={clsx("flex w-full items-center gap-x-2 p-2")}>
            {(category || values.search) && (
               <button className="size cursor-pointer p-2 text-white/70 hover:text-white" onClick={() => handleSelectCategory(null)}>
                  <IconMingcuteArrowLeftFill className="size-6" />
               </button>
            )}
            {category !== "trending" ? (
               <HuginnInput {...register("search")} placeholder={"Search in Klipy..."} className="w-full">
                  <HuginnInput.Wrapper>
                     <IconMingcuteSearch2Fill className="text-text ml-2 size-6" />
                     <HuginnInput.Input data-keyboard-no-close />
                  </HuginnInput.Wrapper>
               </HuginnInput>
            ) : (
               <div className="font-semibold text-white">Trending Gifs</div>
            )}
         </div>
         <div className="bg-surface h-px shrink-0" />
         <HuginnTab className="flex h-full flex-col overflow-hidden" onChange={handleSelectTab} value={selectedTab}>
            <HuginnTab.TabList className="gap-x-2 bg-transparent p-2 pb-0" tabClassName="py-1 w-full">
               <HuginnTab.Tab value="your">
                  <IconMingcuteStarFill className="size-5" />
                  <span>Your Gifs</span>
               </HuginnTab.Tab>
               <HuginnTab.Tab value="all">All GIFs</HuginnTab.Tab>
            </HuginnTab.TabList>
            <HuginnTab.TabPanels className="flex h-full w-full overflow-hidden" panelClassName="w-full h-full">
               <HuginnTab.TabPanel value="your" className="py-2">
                  {(!favoriteGifs || favoriteGifs?.length === 0) && (
                     <div className="text-text/70 flex h-full w-full flex-col items-center justify-center gap-2 text-center">
                        <IconMingcuteSadFill className="size-10" />
                        <div>Maybe go favorite some gifs?</div>
                     </div>
                  )}
                  {favoriteGifs && favoriteGifs?.length > 0 && (
                     <div className="scroll-super-thin h-full overflow-y-scroll pr-0 pl-2" onScroll={handleScroll}>
                        <GifGrid
                           gifs={favoriteGifs}
                           gap={4}
                           onScroll={handleScroll}
                           onGifSelect={handleSelectGif}
                           isLoading={values.search !== search || isLoading}
                        />
                     </div>
                  )}
               </HuginnTab.TabPanel>
               <HuginnTab.TabPanel value="all" className="py-2">
                  {!category && !values.search ? (
                     <div className="scroll-super-thin grid h-full grid-cols-2 gap-2 overflow-y-scroll pr-0 pl-2">
                        <GifCategory src={data?.trendingGif.src} className="col-span-2" isVideo onClick={() => handleSelectCategory("trending")}>
                           <IconMingcuteTrendingUpFill className="size-5" />
                           <span>Trending</span>
                        </GifCategory>
                        {data?.categories?.map((x) => (
                           <GifCategory key={x.name} src={x.src} onClick={() => handleSelectCategory(x.name)}>
                              {x.name}
                           </GifCategory>
                        ))}
                     </div>
                  ) : (
                     <div className="scroll-super-thin h-full overflow-y-scroll pr-0 pl-2" onScroll={handleScroll}>
                        <GifGrid
                           gifs={gifs}
                           gap={4}
                           onScroll={handleScroll}
                           onGifSelect={handleSelectGif}
                           isLoading={values.search !== search || isLoading}
                        />
                     </div>
                  )}
               </HuginnTab.TabPanel>
            </HuginnTab.TabPanels>
         </HuginnTab>
      </div>
   );
}

function GifGrid(props: {
   gifs: (APIGif | FavoriteGif)[];
   isLoading: boolean;
   gap: number;
   onScroll?: (e: UIEvent<HTMLDivElement>) => void;
   onGifSelect?: (gif: FavoriteGif) => void;
}) {
   const [containerRef, width] = useContainerWidth();

   const rows = useMemo(() => {
      const items = props.gifs.map((gif) => ({ ...gif, aspectRatio: gif.width / gif.height }));
      return computeJustifiedRows({ items, containerWidth: width, gap: props.gap, minPerRow: 2, targetHeight: 100 });
   }, [width, props.gifs, props.gap]);

   return (
      <div ref={containerRef} className="flex h-full w-full flex-col" style={{ gap: props.gap }}>
         {props.isLoading || !width ? (
            <div className="text-text/70 flex h-full items-center justify-center gap-x-2">
               <LoadingIcon className="size-10" />
            </div>
         ) : (
            rows?.map((row, index) => (
               <div className="flex" key={index} style={{ gap: props.gap }}>
                  {row.items.map((x) => {
                     const width = row.height * x.aspectRatio;
                     return (
                        <Gif
                           key={x.url}
                           preview={"preview" in x ? x.preview : undefined}
                           src={x.src}
                           style={{ width, height: row.height }}
                           onClick={() => props.onGifSelect?.(x)}
                        />
                     );
                  })}
               </div>
            ))
         )}
      </div>
   );
}

function GifCategory(props: { src?: string; children?: ReactNode; className?: string; isVideo?: boolean; onClick?: () => void }) {
   return (
      <button
         className={clsx(
            "group hover:border-primary-700 active:border-primary-700 relative h-24 w-full cursor-pointer rounded-md border-2 border-transparent transition-[border] select-none",
            props.className,
         )}
         onClick={props.onClick}
      >
         <div className="absolute inset-0 flex items-center justify-center gap-x-2 rounded-md bg-black/70 font-semibold text-white transition-[backdrop-filter] group-hover:backdrop-blur-sm group-active:backdrop-blur-sm">
            {props.children}
         </div>
         {props.isVideo ? (
            <video src={props.src} autoPlay loop muted className="size-full rounded-md object-cover" />
         ) : (
            <img src={props.src} className="size-full rounded-md object-cover" />
         )}
      </button>
   );
}

function Gif(props: { src: string; preview?: string; onClick?: () => void; style?: CSSProperties }) {
   const [isLoaded, setIsLoaded] = useState(false);

   function handleLoadedData() {
      setIsLoaded(true);
   }

   return (
      <button
         className={clsx(
            "group hover:border-primary-700 active:border-primary-700 relative cursor-pointer overflow-hidden rounded-md border-2 border-transparent transition-[border]",
         )}
         onClick={props.onClick}
         style={props.style}
      >
         {!isLoaded && props.preview && (
            <div className="absolute inset-0">
               <img src={props.preview} className="size-full object-cover" />
            </div>
         )}
         <video src={props.src} autoPlay loop muted className="size-full object-cover" onLoadedData={handleLoadedData} />
      </button>
   );
}

function computeJustifiedRows<T extends { aspectRatio: number }>(options: {
   items: T[];
   containerWidth: number;
   targetHeight: number;
   gap: number;
   minPerRow: number;
}) {
   const rows = [];
   const n = options.items.length;
   let i = 0;

   while (i < n) {
      let sumAR = 0;
      let count = 0;
      let height = options.targetHeight;

      while (i + count < n) {
         const ar = options.items[i + count].aspectRatio;
         const nextCount = count + 1;
         const nextSumAR = sumAR + ar;
         const nextHeight = (options.containerWidth - options.gap * (nextCount - 1)) / nextSumAR;

         const mustFillMin = nextCount <= options.minPerRow;
         const stillTallerThanTarget = nextHeight >= options.targetHeight;

         if (mustFillMin || stillTallerThanTarget) {
            sumAR = nextSumAR;
            count = nextCount;
            height = nextHeight;
            continue;
         }

         // Adding this item drops us below target height. Choose whichever
         // is the smaller deviation from target: current row, or +1 item.
         const currentDiff = Math.abs(height - options.targetHeight);
         const nextDiff = Math.abs(nextHeight - options.targetHeight);
         if (nextDiff < currentDiff) {
            sumAR = nextSumAR;
            count = nextCount;
            height = nextHeight;
         }
         break;
      }

      const isLastRow = i + count >= n;
      // Don't let a sparse trailing row (e.g. 1-2 leftover items) blow up
      // to a huge height just to fill the row width.
      if (isLastRow && height > options.targetHeight * 1.5) {
         height = options.targetHeight;
      }

      rows.push({ items: options.items.slice(i, i + count), height });
      i += count;
   }

   return rows as { items: T[]; height: number }[];
}
