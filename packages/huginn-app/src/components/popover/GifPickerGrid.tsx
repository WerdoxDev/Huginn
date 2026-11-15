import type { APIExpression } from "@huginnjs/shared";
import type { ReactNode } from "react";

import { useContainerWidth } from "@hooks/useContainerWidth";
import { HuginnLoadingIcon } from "@huginn/frontend-shared";
import { useMemo } from "react";

export default function GifPickerGrid({
   gifs,
   createButton,
   renderGif,
}: {
   gifs: APIExpression[];
   createButton?: ReactNode;
   renderGif: (gif: APIExpression) => ReactNode;
}) {
   const [containerRef, width] = useContainerWidth();
   const gap = 4;
   const rows = useMemo(() => {
      if (!width) return [];
      const items: { gif?: APIExpression; aspectRatio: number }[] = gifs.map((gif) => ({
         gif,
         aspectRatio: gif.width > 0 && gif.height > 0 ? gif.width / gif.height : 1,
      }));
      if (createButton) items.unshift({ aspectRatio: 1 });
      return computeJustifiedRows({ items, containerWidth: width, gap, minPerRow: 2, targetHeight: 100 });
   }, [gifs, width, !!createButton]);

   return (
      <div ref={containerRef} className="flex w-full flex-col" style={{ gap }}>
         {!width && <HuginnLoadingIcon className="size-5 shrink-0 self-center" />}
         {rows.map((row, index) => (
            <div key={index} className="flex shrink-0" style={{ gap }}>
               {row.items.map(({ gif, aspectRatio }) => (
                  <div
                     key={gif ? `${gif.type}:${gif.id}` : "create"}
                     className="min-w-0 shrink-0"
                     style={{ width: row.height * aspectRatio, height: row.height }}
                  >
                     {gif ? renderGif(gif) : createButton}
                  </div>
               ))}
            </div>
         ))}
      </div>
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
