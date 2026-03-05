import { useStartBackground } from "@stores/startBackgroundStore";
import { useModals } from "@stores/modalsStore";
import { useQueryClient } from "@tanstack/react-query";
import clsx from "clsx";
import { useEffect } from "react";
import { Outlet } from "react-router";
import StartBackgroundSvg from "@components/StartBackgroundSvg";

export default function StartLayout() {
   const startBackground = useStartBackground();

   const { updateModals } = useModals();
   const queryClient = useQueryClient();

   useEffect(() => {
      queryClient.removeQueries({ queryKey: ["channels"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      queryClient.removeQueries({ queryKey: ["relationships"] });
   }, []);
   return (
      <div className={clsx("absolute inset-0", startBackground.state === 2 && "pointer-events-none")}>
         <div className="absolute flex h-full w-full items-center justify-center">
            <Outlet />
         </div>
         {/* <StartBackgroundSvg state={startBackground.state} /> */}
         <button
            type="button"
            className="hover:bg-surface absolute right-2.5 bottom-2.5 z-10 cursor-pointer rounded-lg p-1 transition-all"
            onClick={() => {
               updateModals({ settings: { isOpen: true } });
            }}
         >
            <IconMingcuteSettings5Fill className="h-6 w-6 text-white/80 transition-all hover:rotate-60" />
         </button>
      </div>
   );
}
