import { Tabs } from "@base-ui/react";
import clsx from "clsx";
import { type ReactNode } from "react";

export default function FriendsTabItem(props: { children?: ReactNode; tabValue: string; className?: string }) {
   return (
      <Tabs.Tab
         value={props.tabValue}
         className={({ active }) =>
            clsx(
               props.className,
               "cursor-pointer rounded-md px-2 py-1 outline-hidden",
               active ? "text-text bg-surface pointer-events-none" : "text-text/50 hover:text-text hover:bg-surface/50 active:bg-surface/50",
            )
         }
         type="button"
      >
         {props.children}
      </Tabs.Tab>
   );
}
