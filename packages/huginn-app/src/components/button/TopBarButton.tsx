import Tooltip from "@components/tooltip/Tooltip";
import clsx from "clsx";
import { type MouseEvent, type ReactNode } from "react";

export default function TopBarButton(props: {
   children?: ReactNode;
   onClick?: (e: MouseEvent<HTMLButtonElement>) => void;
   tooltip?: string;
   className?: string;
}) {
   return (
      <Tooltip hideOnMobile>
         <Tooltip.Trigger
            className={clsx("text-text/80 hover:text-text active:text-text transition-colors", props.className)}
            onClick={props.onClick}
         >
            {props.children}
         </Tooltip.Trigger>
         <Tooltip.Content>{props.tooltip}</Tooltip.Content>
      </Tooltip>
   );
}
