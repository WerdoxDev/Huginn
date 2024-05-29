import { Menu, MenuButton, MenuItem, MenuItems, Transition } from "@headlessui/react";
import { client } from "../lib/api";
import UserIconWithStatus from "./UserIconWithStatus";
import { useMutation } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { APIUser } from "@shared/api-types";

export default function UserInfo(props: { user: APIUser }) {
   const navigate = useNavigate();

   const mutation = useMutation({
      async mutationFn() {
         localStorage.removeItem("refresh-token");
         await client.logout();
         await navigate({ to: "/login" });
      },
   });
   return (
      <section className=" flex h-16 w-64 flex-shrink-0 flex-grow-0 items-center justify-center">
         <Menu>
            <MenuButton
               as="div"
               className="group flex w-full cursor-pointer items-center rounded-xl px-2 py-1 hover:bg-white hover:bg-opacity-5"
            >
               <UserIconWithStatus className="mr-3 flex-shrink-0 bg-secondary" />

               <div className="flex w-full flex-col items-start">
                  <div className="text-base text-text">{props.user?.displayName}</div>
                  <div className="text-xs text-text/70">Online</div>
               </div>
               <div className="flex flex-shrink-0 gap-x-1">
                  <button className="group/setting rounded-lg p-1 hover:bg-background">
                     <IconMdiSettings className="h-6 w-6 text-white/80 transition-all group-hover/setting:rotate-[60deg]" />
                  </button>
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
                  className="w-64 divide-y divide-secondary rounded-lg bg-background shadow-lg outline-none transition [--anchor-gap:0.5rem]"
                  anchor="top"
               >
                  <div className="p-1">
                     <MenuItem>
                        <button
                           className="flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 text-error hover:bg-error/10"
                           onClick={() => mutation.mutate()}
                        >
                           <IconMdiLogout className="h-5 w-5" />
                           <span className="text-sm">Logout</span>
                        </button>
                     </MenuItem>
                  </div>
                  <div className="p-1">
                     <MenuItem>
                        <button className="flex w-full items-center gap-x-2.5 rounded-md px-2 py-1.5 text-text hover:bg-secondary">
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
