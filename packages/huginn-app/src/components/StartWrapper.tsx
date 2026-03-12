import clsx from "clsx";
import { type ReactNode, type SubmitEvent } from "react";

export default function StartWrapper(props: {
   className?: string;
   children?: ReactNode;
   onSubmit?: (e: SubmitEvent) => void;
   transitionName?: string;
   shownId?: string;
}) {
   return (
      <form
         onSubmit={props.onSubmit}
         className={clsx(
            "group/wrapper bg-surface relative flex w-96 flex-col items-start rounded-lg p-5 shadow-xl transition-shadow hover:shadow-2xl",
            props.className,
         )}
         style={{ viewTransitionName: props.transitionName }}
      >
         {props.children}
      </form>
   );
}
