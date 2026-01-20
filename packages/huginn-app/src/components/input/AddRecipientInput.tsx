import type { AppRelationship, AppUser } from "@/types";
import UserAvatar from "@components/UserAvatar";
import { Checkbox } from "@headlessui/react";
import { useUsers } from "@hooks/api-hooks/userHooks";
import { RelationshipType, type Snowflake } from "@huginn/shared";
import { useMemo, useState } from "react";
import ComboboxInput from "./ComboboxInput";
import HuginnInput from "./HuginnInput";

export default function AddRecipientInput(props: {
   label?: string;
   relationships?: AppRelationship[];
   onSelectionChanged?: (values: AppUser[]) => void;
}) {
   const [query, setQuery] = useState("");

   const [selectedUsers, setSelectedUsers] = useState<Snowflake[]>([]);
   const toAddUsers = useUsers(selectedUsers);
   const relationshipUsers = useUsers(props.relationships?.filter((x) => x.type === RelationshipType.FRIEND).map((x) => x.userId));

   const filteredUsers = useMemo(() => relationshipUsers?.filter((x) => (query ? x.displayName?.includes(query) : true)), [query, relationshipUsers]);

   function selectionChanged(values: Snowflake[]) {
      setSelectedUsers(values);
      props.onSelectionChanged?.(relationshipUsers?.filter((x) => values.includes(x.id)) ?? []);
   }

   return (
      <ComboboxInput
         onSelectionChange={selectionChanged}
         selection={selectedUsers}
         message={{ status: "none", text: "" }}
         onChange={(e) => setQuery(e.target.value)}
      >
         <HuginnInput.Label className="mb-2" text={props.label ?? "Members"} />
         <HuginnInput.Wrapper className="flex-col items-start!">
            <ComboboxInput.SelectionDisplay>
               {({ toggleSelection }) => (
                  <div className="mx-2 mt-2 flex flex-wrap gap-1 select-none">
                     {toAddUsers?.map((user) => (
                        <button
                           type="button"
                           onClick={() => toggleSelection(user.id)}
                           key={user.id}
                           className="bg-primary-700 text-text rounded-xs px-2"
                        >
                           {user.displayName}
                        </button>
                     ))}
                  </div>
               )}
            </ComboboxInput.SelectionDisplay>
            <HuginnInput.Input className="w-full" />
         </HuginnInput.Wrapper>
         <ComboboxInput.OptionWrapper>
            {query && filteredUsers?.length === 0 ? (
               <div className="text-text flex h-full w-full items-center justify-center">No friends matched your search!</div>
            ) : (
               filteredUsers?.length === 0 && (
                  <div className="text-text flex h-full w-full items-center justify-center">You don't have any eligible friends!</div>
               )
            )}
            {filteredUsers?.map((x) => (
               <ComboboxInput.Option value={x.id} key={x.id}>
                  <UserAvatar userId={x.id} avatarHash={x.avatar} />
                  <div className="text-text overflow-hidden text-nowrap text-ellipsis">{x.displayName}</div>
                  <div className="text-text/70 text-sm">{x.username}</div>
                  <Checkbox
                     checked={selectedUsers?.includes(x.id) ?? false}
                     className="border-primary-500 data-checked:bg-primary-500 ml-auto size-6 shrink-0 rounded-md border"
                  />
               </ComboboxInput.Option>
            ))}
         </ComboboxInput.OptionWrapper>
      </ComboboxInput>
   );
}
