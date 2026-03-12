import type { ReactNode } from "react";

import Tooltip from "@components/tooltip/Tooltip";
import clsx from "clsx";

const colors = {
   none: "",
   surface: "bg-surface",
   "surface-alt": "bg-surface-alt",
   negative: "bg-negative-500",
   primary: "bg-primary-800",
   positive: "bg-positive-500",
} as const;

const hoverColors = {
   none: "",
   surface: "hover:bg-surface",
   "surface-alt": "hover:bg-surface-alt",
   "surface-deep": "hover:bg-surface-deep",
   negative: "hover:bg-negative-300",
   primary: "hover:bg-primary-600",
   positive: "hover:bg-positive-300",
} as const;

type Colors = keyof typeof colors;
type HoverColors = keyof typeof hoverColors;

export default function VoiceControlButton(props: {
   onClick?: () => void;
   isActive?: boolean;
   color?: Colors;
   activeColor?: Colors;
   activeHoverColor?: HoverColors;
   hoverColor?: HoverColors;
   className?: string;
   children?: ReactNode;
   tooltip: string;
   asChild?: boolean;
}) {
   return (
      <Tooltip>
         <Tooltip.Trigger
            asChild={props.asChild ? true : undefined}
            className={clsx(
               "group rounded-lg px-5 py-1.5 text-white transition-[border-radius_background-color]",
               colors[(props.isActive && props.activeColor ? props.activeColor : props.color) ?? "none"],
               hoverColors[(props.isActive && props.activeHoverColor ? props.activeHoverColor : props.hoverColor) ?? "surface"],
               props.className,
            )}
            onClick={props.onClick}
         >
            {props.children}
         </Tooltip.Trigger>
         <Tooltip.Content>{props.tooltip}</Tooltip.Content>
      </Tooltip>
   );
}
