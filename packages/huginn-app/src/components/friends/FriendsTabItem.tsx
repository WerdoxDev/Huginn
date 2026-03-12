import { Tab } from "@headlessui/react";
import clsx from "clsx";
import { Fragment, type ReactNode } from "react";

export default function FriendsTabItem(props: { children?: ReactNode }) {
   return (
      <Tab as={Fragment}>
         {({ selected }) => (
            <button
               className={clsx(
                  "cursor-pointer rounded-md px-2 py-0.5 outline-hidden",
                  selected ? "text-text pointer-events-none bg-white/10" : "text-text/50 hover:text-text hover:bg-white/5",
               )}
               type="button"
            >
               {props.children}
            </button>
         )}
      </Tab>
   );
}
