import { useMainViewTransitionState } from "@hooks/useMainViewTransitionState";
import clsx from "clsx";
import { type FormEvent, type ReactNode, useState } from "react";

export default function StartWrapper(props: {
   className?: string;
   children?: ReactNode;
   onSubmit?: (e: FormEvent) => void;
   transitionName?: string;
   shownId?: string;
}) {
   const { isMainTransitioning, isStartTransitioning } = useMainViewTransitionState();
   const [canPlay] = useState(!isStartTransitioning || isMainTransitioning);

   return (
      <form
         id={!isStartTransitioning || isMainTransitioning ? (canPlay ? (props.shownId ?? "start-form") : "") : ""}
         onSubmit={props.onSubmit}
         className={clsx(
            "group/wrapper bg-surface relative flex w-96 flex-col items-start rounded-lg p-5 shadow-xl transition-shadow hover:shadow-2xl",
            props.className,
         )}
         style={isStartTransitioning ? { viewTransitionName: props.transitionName } : undefined}
      >
         {props.children}
      </form>
   );
}
