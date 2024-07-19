import { useModalsDispatch } from "@contexts/modalContext";
import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { useLogout } from "@hooks/useLogout";
import { APIUser } from "@huginn/shared";
import { useMutation } from "@tanstack/react-query";
import UserIconWithStatus from "./UserIconWithStatus";
import { Tooltip } from "./tooltip/Tooltip";

export default function UserInfo(props: { user: APIUser }) {
   const modalsDispatch = useModalsDispatch();
   const logout = useLogout();

   const mutation = useMutation({
      async mutationFn() {
         await logout(true);
      },
   });

   function openSettings(e: React.MouseEvent) {
      e.stopPropagation();
      modalsDispatch({ settings: { isOpen: true } });
   }

   return (
      <section className=" flex h-16 w-64 flex-shrink-0 flex-grow-0 items-center justify-center">
         <Menu>
            <MenuButton
               as="div"
               className="group flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white hover:bg-opacity-5"
            >
               <UserIconWithStatus className="mr-3 flex-shrink-0 bg-secondary" />

               <div className="flex w-full flex-col items-start gap-y-0.5">
                  <div className="text-sm text-text">{props.user?.displayName}</div>
                  <div className="text-xs text-text/70">Online</div>
               </div>
               <div className="flex flex-shrink-0 gap-x-1">
                  <Tooltip>
                     <Tooltip.Trigger className="group/setting rounded-lg p-1 hover:bg-background" onClick={openSettings}>
                        <IconMdiSettings className="h-6 w-6 text-white/80 transition-all group-hover/setting:rotate-[60deg]" />
                     </Tooltip.Trigger>
                     <Tooltip.Content>User Settings</Tooltip.Content>
                  </Tooltip>
               </div>
            </MenuButton>

            <Transition
               enter="duration-150 ease-out"
               enterFrom="opacity-0 scale-95"
               enterTo="opacity-100 scale-100"
               leave="duration-150 ease-in"
               leaveFrom="opacity-100 scale-100"
               leaveTo="opacity-0 scale-95"
            >
               <MenuItems
                  className="w-60 divide-y divide-secondary rounded-lg bg-zinc-900 shadow-lg outline-none transition [--anchor-gap:0.5rem]"
                  anchor="top"
               >
                  <div className="p-1.5">
                     <MenuItem>
                        <button
                           className="flex w-full items-center gap-x-2.5 rounded-md px-2 py-2 text-error hover:bg-error/10"
                           onClick={() => mutation.mutate()}
                        >
                           <IconMdiLogout className="h-5 w-5" />
                           <span className="text-sm">Logout</span>
                        </button>
                     </MenuItem>
                  </div>
                  <div className="p-1.5">
                     <MenuItem>
                        <button className="flex w-full items-center gap-x-2.5 rounded-md px-2 py-2 text-text hover:bg-secondary">
                           <IconMdiIdentificationCard className="h-5 w-5" />
                           <span className="text-sm">Copy User ID</span>
                        </button>
                     </MenuItem>
                  </div>
               </MenuItems>
            </Transition>
         </Menu>
      </section>
   );
}