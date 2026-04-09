import { clamp } from "@huginn/shared";
import clsx from "clsx";
import { useLayoutEffect, useRef, useState } from "react";

type GhostType = "text" | "image" | "text-image";

interface GhostLine {
   type: GhostType;
   width: number;
}

interface GhostGroupDef {
   lines: GhostLine[];
}

const GHOST_GROUPS: GhostGroupDef[] = [
   {
      lines: [
         { type: "text", width: 55 },
         { type: "text", width: 75 },
         { type: "image", width: 0 },
      ],
   },
   {
      lines: [
         { type: "text", width: 40 },
         { type: "text", width: 65 },
      ],
   },
   {
      lines: [
         { type: "text-image", width: 50 },
         { type: "text", width: 80 },
      ],
   },
   {
      lines: [
         { type: "text", width: 35 },
         { type: "text", width: 60 },
         { type: "text", width: 45 },
      ],
   },
   {
      lines: [{ type: "text", width: 70 }],
   },
   {
      lines: [{ type: "image", width: 0 }],
   },
   {
      lines: [
         { type: "text", width: 45 },
         { type: "text", width: 85 },
      ],
   },
   {
      lines: [
         { type: "text", width: 55 },
         { type: "text-image", width: 40 },
      ],
   },
   {
      lines: [
         { type: "text", width: 70 },
         { type: "text", width: 50 },
         { type: "text", width: 65 },
      ],
   },
   {
      lines: [
         { type: "text", width: 60 },
         { type: "image", width: 0 },
      ],
   },
];

function GhostMessageGroup(props: { group: GhostGroupDef; addTopMargin: boolean; addBottomMargin: boolean }) {
   const bubbleRefs = useRef<(HTMLDivElement | null)[]>([]);
   const [widths, setWidths] = useState<number[]>([]);

   useLayoutEffect(() => {
      setWidths(bubbleRefs.current.map((ref) => ref?.clientWidth || 0));
   }, []);

   const { lines } = props.group;

   return (
      <>
         {lines.map((line, i) => {
            const isFirst = i === 0;
            const isLast = i === lines.length - 1;
            const selfWidth = widths[i] || 0;
            const prevWidth = i > 0 ? widths[i - 1] || 0 : 0;
            const nextWidth = i < lines.length - 1 ? widths[i + 1] || 0 : 0;
            const hasInvertedTop = !isFirst && prevWidth > selfWidth;
            const hasInvertedBottom = !isLast && nextWidth > selfWidth;

            return (
               <div
                  key={i}
                  className={clsx(
                     "flex shrink-0 flex-col items-start p-2 pl-4",
                     !isFirst && "py-0",
                     !isLast && "pb-0",
                     isFirst && props.addTopMargin && "mt-1.5",
                     isLast && props.addBottomMargin && "mb-4",
                  )}
               >
                  {isFirst && (
                     <div className="flex items-center gap-x-2">
                        <div className="bg-text/10 size-7 shrink-0 rounded-full" />
                        <div className="bg-text/10 h-3.5 w-20 rounded-md" />
                        <div className="bg-text/10 h-2.5 w-14 rounded-md" />
                     </div>
                  )}

                  <div className={clsx("flex w-full animate-pulse items-start", isFirst && "mt-2")}>
                     <div
                        ref={(el) => {
                           bubbleRefs.current[i] = el;
                        }}
                        className={clsx(
                           "bg-surface relative px-2.5 py-1.5",
                           line.type === "image" && "w-fit",
                           isFirst && "rounded-t-xl!",
                           isLast && "rounded-b-xl!",
                        )}
                        style={{
                           ...(line.type !== "image" ? { width: `${line.width}%` } : {}),
                           ...(line.type === "text-image" ? { minWidth: "fit-content" } : {}),
                           borderBottomRightRadius: `${clamp((selfWidth - nextWidth) / 2, 0, 12)}px`,
                           borderTopRightRadius: `${clamp((selfWidth - prevWidth) / 2, 0, 12)}px`,
                        }}
                     >
                        {hasInvertedTop && (
                           <div className="absolute top-0 -right-10 h-10 w-10 overflow-hidden">
                              <div
                                 className={clsx("h-full w-full overflow-hidden [box-shadow:0_-20px_0_0_rgb(var(--tcolor-surface))]")}
                                 style={{
                                    borderTopLeftRadius: `${clamp((prevWidth - selfWidth) / 2, 0, 12)}px`,
                                 }}
                              />
                           </div>
                        )}

                        {hasInvertedBottom && (
                           <div className="absolute -right-10 bottom-0 h-10 w-10 overflow-hidden">
                              <div
                                 className={clsx("h-full w-full overflow-hidden [box-shadow:0_20px_0_0_rgb(var(--tcolor-surface))]")}
                                 style={{
                                    borderBottomLeftRadius: `${clamp((nextWidth - selfWidth) / 2, 0, 12)}px`,
                                 }}
                              />
                           </div>
                        )}

                        <div className="flex flex-col gap-y-1">
                           {(line.type === "text" || line.type === "text-image") && <div className="h-6 w-full animate-pulse rounded-md" />}
                           {(line.type === "image" || line.type === "text-image") && <div className="h-36 w-44 animate-pulse rounded-md" />}
                        </div>
                     </div>
                  </div>
               </div>
            );
         })}
      </>
   );
}

export default function GhostMessages(props: { position: "top" | "bottom" }) {
   const groups = props.position === "top" ? GHOST_GROUPS : [...GHOST_GROUPS].reverse();

   return (
      <div className="pointer-events-none shrink-0">
         {groups.map((group, i) => (
            <GhostMessageGroup key={i} group={group} addTopMargin={i > 0} addBottomMargin={i === groups.length - 1} />
         ))}
      </div>
   );
}
