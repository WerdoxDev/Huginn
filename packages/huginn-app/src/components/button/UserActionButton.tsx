import type { MouseEvent, ReactNode } from "react";

import Tooltip from "@components/tooltip/Tooltip";
import clsx from "clsx";

const colors = {
   none: "",
   negative: "bg-negative-500",
   primary: "bg-primary-800",
   positive: "bg-positive-500",
} as const;

const hoverColors = {
   none: "",
   surface: "hover:bg-surface active:bg-surface",
   "surface-alt": "hover:bg-surface-alt active:bg-surface-alt",
   negative: "hover:bg-negative-300 active:bg-negative-300",
   primary: "hover:bg-primary-600 active:bg-primary-600",
   positive: "hover:bg-positive-300 active:bg-positive-300",
} as const;

type Colors = keyof typeof colors;
type HoverColors = keyof typeof hoverColors;

export default function UserActionButton(props: {
   onClick?: (e: MouseEvent) => void;
   tooltip: string;
   children?: ReactNode;
   color?: Colors;
   activeColor?: Colors;
   activeHoverColor?: HoverColors;
   hoverColor?: HoverColors;
   isActive?: boolean;
   className?: string;
   innerClassName?: string;
}) {
   return (
      <Tooltip>
         <Tooltip.Trigger
            onClick={(e) => {
               e.stopPropagation();
               props.onClick?.(e);
            }}
            onPointerDown={(e) => {
               e.stopPropagation();
            }}
            onMouseDown={(e) => {
               e.stopPropagation();
            }}
            className={clsx(
               "group rounded-lg p-1.5 text-white transition-colors",
               colors[(props.isActive && props.activeColor ? props.activeColor : props.color) ?? "none"],
               hoverColors[(props.isActive && props.activeHoverColor ? props.activeHoverColor : props.hoverColor) ?? "surface"],
               props.className,
            )}
         >
            <div
               className={clsx(
                  "transition-[transform_color] group-hover:-rotate-12 group-hover:text-white group-active:-rotate-12 group-active:text-white",
                  props.isActive ? "text-white" : "text-white/80",
                  props.innerClassName,
               )}
            >
               {props.children}
            </div>
         </Tooltip.Trigger>
         <Tooltip.Content>{props.tooltip}</Tooltip.Content>
      </Tooltip>
   );
}
