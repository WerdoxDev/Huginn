import { Tabs } from "@base-ui/react";
import clsx from "clsx";
import { type ReactNode } from "react";

export default function FriendsTabItem(props: { children?: ReactNode; tabValue: string }) {
   return (
      <Tabs.Tab
         value={props.tabValue}
         className={({ active }) =>
            clsx(
               "cursor-pointer rounded-md px-2 py-0.5 outline-hidden",
               active ? "text-text pointer-events-none bg-white/10" : "text-text/50 hover:text-text hover:bg-white/5",
            )
         }
         type="button"
      >
         {props.children}
      </Tabs.Tab>
   );
}
