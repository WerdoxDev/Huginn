import HuginnButton from "@components/button/HuginnButton";
import { ComboboxInput } from "@components/input/ComboboxInput";
import HuginnInput from "@components/input/HuginnInput";
import UserAvatarWithStatus from "@components/UserAvatarWithStatus";
import { useClient } from "@contexts/apiContext";
import { useModals, useModalsDispatch } from "@contexts/modalContext";
import { Checkbox, Description, DialogPanel, DialogTitle } from "@headlessui/react";
import { useCreateDMChannel } from "@hooks/mutations/useCreateDMChannel";
import { useChannelName } from "@hooks/useChannelName";
import { useInputs } from "@hooks/useInputs";
import { RelationshipType, Snowflake } from "@huginn/shared";
import { getRelationshipsOptions } from "@lib/queries";
import { useQuery } from "@tanstack/react-query";
import { usePostHog } from "posthog-js/react";
import { useEffect, useMemo, useState } from "react";
import BaseModal from "./BaseModal";

export function CreateDMModal() {
   const { createDM: modal } = useModals();
   const dispatch = useModalsDispatch();
   const client = useClient();
   const mutation = useCreateDMChannel();

   const posthog = usePostHog();
   const { data } = useQuery(getRelationshipsOptions(client));

   const [selectedUsers, setSelectedUsers] = useState<Snowflake[]>([]);
   const [query, setQuery] = useState("");
   const { inputsProps, setInputValue, values } = useInputs([{ name: "groupName", required: false }]);

   const filteredUsers = useMemo(
      () =>
         data?.filter(
            x =>
               x.type === RelationshipType.FRIEND &&
               // eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
               (query ? x.user.displayName?.includes(query) || x.user.username.includes(query) : true),
         ),
      [query, data],
   );

   const selectedUsersDisplay = useMemo(
      () => data?.filter(x => selectedUsers.includes(x.user.id)).map(x => x.user),
      [data, selectedUsers],
   );

   const placeholderName = useChannelName(selectedUsersDisplay, null);

   useEffect(() => {
      if (modal.isOpen) {
         posthog.capture("create_group_modal_opened");
      } else {
         posthog.capture("create_group_modal_closed");
      }
   }, [modal.isOpen]);

   useEffect(() => {
      if (selectedUsers.length < 2) {
         setInputValue("groupName", "");
      }
   }, [selectedUsers]);

   function close() {
      dispatch({ createDM: { isOpen: false } });
      setSelectedUsers([]);
      setQuery("");
   }

   async function findOrCreate() {
      await mutation.mutateAsync({ recipients: selectedUsers, name: values.groupName.value });
      dispatch({ createDM: { isOpen: false } });
      setSelectedUsers([]);
      setQuery("");
   }

   return (
      <BaseModal modal={modal} onClose={close}>
         <DialogPanel className="bg-background border-primary w-full max-w-sm transform overflow-hidden rounded-xl border-2 p-5 transition-[opacity_transform] data-[closed]:scale-95">
            <DialogTitle className="flex items-center justify-center gap-x-1.5">
               <div className="text-text text-2xl font-medium">Create Direct Message</div>
            </DialogTitle>
            <Description className="text-text/70 mx-5 mt-1 text-center">
               Select your fellow warrior(s) to share a tale with!
            </Description>
            <div className="mt-5 flex flex-col gap-y-5">
               <HuginnInput
                  {...inputsProps.groupName}
                  status={{ code: "none", text: "" }}
                  placeholder={selectedUsers.length > 1 ? placeholderName : "Select 2 or more members"}
                  disabled={selectedUsers.length < 2}
               >
                  <HuginnInput.Label className="mb-2" text="Group Name" />
                  <HuginnInput.Wrapper>
                     <HuginnInput.Input />
                  </HuginnInput.Wrapper>
               </HuginnInput>

               <ComboboxInput
                  onSelectionChange={setSelectedUsers}
                  selection={selectedUsers}
                  status={{ code: "none", text: "" }}
                  onChange={e => setQuery(e.value)}
               >
                  <HuginnInput.Label className="mb-2" text="Members" />
                  <HuginnInput.Wrapper border="left" className="flex-col !items-start">
                     <ComboboxInput.SelectionDisplay>
                        {({ toggleSelection }) => (
                           <div className="mx-2 mt-2 flex select-none flex-wrap gap-1">
                              {selectedUsersDisplay?.map(user => (
                                 <button
                                    onClick={() => toggleSelection(user.id)}
                                    key={user.id}
                                    className="text-text bg-primary rounded-sm px-2"
                                 >
                                    {user.displayName ?? user.username}
                                 </button>
                              ))}
                           </div>
                        )}
                     </ComboboxInput.SelectionDisplay>
                     <HuginnInput.Input className="w-full" />
                  </HuginnInput.Wrapper>
                  <ComboboxInput.OptionWrapper>
                     {filteredUsers?.map(x => (
                        <ComboboxInput.Option value={x.user.id} key={x.user.id}>
                           <UserAvatarWithStatus userId={x.user.id} avatarHash={x.user.avatar} />
                           <div className="text-text">{x.user.displayName ?? x.user.username}</div>
                           <div className="text-text/70 text-sm">{x.user.username}</div>
                           <Checkbox
                              checked={selectedUsers?.includes(x.user.id) ?? false}
                              className="border-accent data-[checked]:bg-accent ml-auto size-6 rounded-md border "
                           ></Checkbox>
                        </ComboboxInput.Option>
                     ))}
                  </ComboboxInput.OptionWrapper>
               </ComboboxInput>
               {/* <Combobox multiple value={selectedUsers} onChange={setSelectedUsers} as="div" className="flex flex-col">
                  <div className="bg-secondary flex w-full flex-col items-start rounded-md">
                     {selectedUsers.length > 0 && (
                        <div className="mx-2 mt-2 flex select-none flex-wrap gap-1">
                           {data
                              ?.filter(x => selectedUsers.includes(x.user.id))
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
                     )}
                     <ComboboxInput
                        placeholder="Search for a friend"
                        className="placeholder-text/60 w-full flex-grow bg-transparent p-2 text-white outline-none"
                        onChange={e => setQuery(e.target.value)}
                     ></ComboboxInput>
                  </div>
                  <ComboboxOptions static>
                     <div className="bg-secondary scroll-alternative2 mt-2 h-40 -scroll-mt-9 overflow-y-scroll rounded-md p-2">
                        {filteredUsers?.map(x => (
                           <ComboboxOption
                              key={x.user.id}
                              value={x.user.id}
                              className="data-[focus]:bg-background -mr-2 flex cursor-pointer items-center gap-x-2 rounded-sm px-2 py-1 outline-none"
                           >
                              <UserAvatarWithStatus userId={x.user.id} avatarHash={x.user.avatar} />
                              <div className="text-text">{x.user.displayName ?? x.user.username}</div>
                              <div className="text-text/70 text-sm">{x.user.username}</div>
                              <Checkbox
                                 checked={selectedUsers?.includes(x.user.id) ?? false}
                                 className="border-accent data-[checked]:bg-accent ml-auto size-6 rounded-md border "
                              ></Checkbox>
                           </ComboboxOption>
                        ))}
                     </div>
                  </ComboboxOptions>
               </Combobox> */}
               <HuginnButton className="bg-primary py-2" onClick={findOrCreate}>
                  Find or Create
               </HuginnButton>
            </div>
         </DialogPanel>
      </BaseModal>
   );
}
