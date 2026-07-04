import type { Snowflake } from "@huginn/shared";

import { useChannelStore } from "@stores/channelStore";
import { clsx } from "clsx";

import type { AutocompleteItem, AutocompleteState } from "@/types";

function renderItem(item: AutocompleteItem) {
   switch (item.type) {
      case "user":
         return <UserRow id={item.id} avatarHash={item.avatarHash} name={item.name} />;
      case "special":
         return <SpecialRow id={item.id} label={item.label} description={item.description} />;
      default:
         return null;
   }
}

export function MessageAutocomplete(props: { state: AutocompleteState | null; items: AutocompleteItem[] }) {
   const { messageBoxHeight } = useChannelStore();

   if (!props.state?.type || props.items.length === 0) return null;
   return (
      <div
         className="bg-surface-alt border-surface absolute right-5 left-5 z-10 flex flex-col rounded-xl border px-5"
         style={{ bottom: messageBoxHeight + 20 }}
      >
         {props.items.map((item, i) => (
            <div key={item.id} className={clsx(i === props.state?.selectedIndex && "bg-surface")}>
               {renderItem(item)}
            </div>
         ))}
      </div>
   );
}

function UserRow(props: { id: Snowflake; avatarHash?: string | null; name: string }) {
   return <div className="text-white">{props.name}</div>;
}

function SpecialRow(props: { id: string; label: string; description: string }) {
   return <div className="text-white">{props.label}</div>;
}
