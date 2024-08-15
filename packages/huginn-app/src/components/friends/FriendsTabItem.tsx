import { Tab } from "@headlessui/react";
import { ReactNode } from "@tanstack/react-router";
import { Fragment } from "react/jsx-runtime";

export default function FriendsTabItem(props: { children?: ReactNode }) {
   return (
      <Tab as={Fragment}>
         {({ selected }) => (
            <button
               className={`rounded-md px-2 py-0.5 outline-none ${selected ? "text-text pointer-events-none bg-white/10" : "text-text/50 hover:text-text/100 hover:bg-white/5"}`}
            >
               {props.children}
            </button>
         )}
      </Tab>
   );
}
