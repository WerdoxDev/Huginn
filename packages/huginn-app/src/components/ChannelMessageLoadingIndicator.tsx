import { Transition } from "@headlessui/react";
import clsx from "clsx";

export default function ChannelMessageLoadingIndicator(props: { isFetchingNextPage: boolean; isFetchingPreviousPage: boolean }) {
   return (
      <>
         <Transition show={props.isFetchingPreviousPage}>
            <div
               className={clsx(
                  "transition duration-75 data-[closed]:opacity-0 data-[closed]:-translate-y-8",
                  "pointer-events-none absolute inset-x-0 z-10 py-2 text-center text-text top-0",
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
                  "transition duration-75 data-[closed]:opacity-0 data-[closed]:translate-y-8",
                  "pointer-events-none absolute inset-x-0 z-10 py-2 text-center text-text bottom-0",
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
