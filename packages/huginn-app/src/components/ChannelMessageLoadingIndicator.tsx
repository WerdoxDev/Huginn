import { Transition } from "@headlessui/react";
import clsx from "clsx";

export default function ChannelMessageLoadingIndicator(props: { isFetchingNextPage: boolean; isFetchingPreviousPage: boolean }) {
   return (
      <>
         <Transition show={props.isFetchingPreviousPage}>
            <div
               className={clsx(
                  "transition duration-75 data-[closed]:-translate-y-8 data-[closed]:opacity-0",
                  "text-text pointer-events-none absolute inset-x-0 top-0 z-10 py-2 text-center",
               )}
            >
               <span>Loading</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
            </div>
         </Transition>
         <Transition show={props.isFetchingNextPage}>
            <div
               className={clsx(
                  "transition duration-75 data-[closed]:translate-y-8 data-[closed]:opacity-0",
                  "text-text pointer-events-none absolute inset-x-0 bottom-0 z-10 py-2 text-center",
               )}
            >
               <span>Loading</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
               <span className="loader__dot">.</span>
            </div>
         </Transition>
      </>
   );
}
