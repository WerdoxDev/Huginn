import HuginnButton from "@components/button/HuginnButton";
import HuginnInput from "@components/input/HuginnInput";
import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { useClient } from "@contexts/apiContext";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { Checkbox, Description, DialogPanel, DialogTitle } from "@headlessui/react";
import { RelationshipType, Snowflake } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import BaseModal from "./BaseModal";
import { usePostHog } from "posthog-js/react";

export function CreateGroupModal() {
   const { createGroup: modal } = useModals();
   const dispatch = useModalsDispatch();
   const client = useClient();
   const posthog = usePostHog();
   const { data } = useQuery(getRelationshipsOptions(client));

   const [selectedUsers, setSelectedUsers] = useState<Snowflake[]>([]);

   function selectUser(userId: Snowflake) {
      let newSelectedUsers = [...selectedUsers];

      if (newSelectedUsers.includes(userId)) {
         newSelectedUsers = newSelectedUsers.filter(x => x !== userId);
      } else {
         newSelectedUsers.push(userId);
      }

      setSelectedUsers(newSelectedUsers);
   }

   function close() {
      setSelectedUsers([]);
      dispatch({ createGroup: { isOpen: false } });
   }

   useEffect(() => {
      if (modal.isOpen) {
         posthog.capture("create_group_modal_opened");
      } else {
         posthog.capture("create_group_modal_closed");
      }
   }, [modal.isOpen]);

   if (!data) {
      return;
   }

   return (
      <BaseModal modal={modal} onClose={close}>
         <DialogPanel className="bg-background border-primary w-full max-w-sm transform overflow-hidden rounded-xl border-2 p-5 transition-[opacity_transform] data-[closed]:scale-95">
            <DialogTitle className="flex items-center justify-center gap-x-1.5">
               <div className="text-text text-2xl font-medium">Create Group</div>
            </DialogTitle>
            <Description className="text-text/70 mx-5 mt-1 text-center">Select your fellow warriors to share a tale with!</Description>
            <div className="mt-5 flex flex-col gap-y-5">
               <HuginnInput status={{ code: "none", text: "" }}>
                  <HuginnInput.Label>Group Name</HuginnInput.Label>
               </HuginnInput>
               <HuginnInput
                  status={{ code: "none", text: "" }}
                  placeholder="Name of a friend"
                  wrapperClassName="!items-start flex-col"
                  inputClassName="w-full"
               >
                  <HuginnInput.Label>Members</HuginnInput.Label>
                  {selectedUsers.length > 0 && (
                     <HuginnInput.Before>
                        <div className="mx-2 mt-2 flex select-none flex-wrap gap-1">
                           {data
                              .filter(x => selectedUsers.includes(x.user.id))
                              .map(x => x.user)
                              .map(user => (
                                 <button
                                    onClick={() => selectUser(user.id)}
                                    key={user.id}
                                    className="text-text bg-background rounded-sm px-2"
                                 >
                                    {user.displayName ?? user.username}
                                 </button>
                              ))}
                        </div>
                     </HuginnInput.Before>
                  )}
                  <HuginnInput.After>
                     <div className="bg-secondary scroll-alternative2 mt-2 h-40 overflow-y-scroll rounded-md p-2">
                        {data
                           .filter(x => x.type === RelationshipType.FRIEND)
                           .map(relationship => (
                              <div className="hover:bg-background -mr-2 rounded-sm" key={relationship.user.id}>
                                 <button
                                    className="flex w-full items-center gap-x-2 px-2 py-1 outline-none"
                                    onClick={() => selectUser(relationship.user.id)}
                                 >
                                    <UserAvatarWithStatus userId={relationship.user.id} avatarHash={relationship.user.avatar} />
                                    <div className="text-text">{relationship.user.displayName ?? relationship.user.username}</div>
                                    <div className="text-text/70 text-sm">{relationship.user.username}</div>
                                    <Checkbox
                                       checked={selectedUsers?.includes(relationship.user.id) ?? false}
                                       className="border-accent data-[checked]:bg-accent ml-auto size-6 rounded-md border "
                                    ></Checkbox>
                                 </button>
                              </div>
                           ))}
                     </div>
                  </HuginnInput.After>
               </HuginnInput>
               <HuginnButton className="bg-primary py-2">Create</HuginnButton>
            </div>
         </DialogPanel>
      </BaseModal>
   );
}
