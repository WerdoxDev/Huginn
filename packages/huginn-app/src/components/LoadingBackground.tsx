import { Transition } from "@headlessui/react";
import { clsx } from "clsx";

export default function LoadingBackground(props: { isLoaded: boolean; hasError: boolean; className?: string }) {
   return (
      <Transition show={!props.isLoaded || props.hasError}>
         <div
            className={clsx(
               "bg-surface-alt absolute inset-0 flex h-full w-full items-center justify-center overflow-hidden transition-opacity duration-150 data-closed:opacity-0",
               !props.hasError && "animate-pulse",
               props.className,
            )}
         >
            {/* {!props.hasError && <div className="h-full w-full" />} */}
            {props.hasError && <IconMingcuteWarningFill className="text-negative-300 h-full max-h-16 w-full max-w-16" />}
         </div>
      </Transition>
      // <div className="absolute inset-0 z-10 animate-pulse rounded-md bg-black/50" />
   );
}
