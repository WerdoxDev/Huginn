import { useModals } from "@stores/modalsStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { createFileRoute, Outlet, redirect } from "@tanstack/react-router";
import { clientStore } from "@stores/clientStore";

export const Route = createFileRoute("/_app/_start")({
   component: StartLayoutComponent,
   beforeLoad: ({ location }) => {
      const client = clientStore.getState().client;
      if (client?.gateway.status === "authenticated") {
         throw redirect({ to: "/channels/@me" });
      }

      if (!client && location.pathname !== "/") {
         sessionStorage.setItem("redirect", JSON.stringify({ pathname: location.pathname, requiresAuth: false }));
         throw redirect({ to: "/" });
      }
   },
});

function StartLayoutComponent() {
   const { updateModals } = useModals();
   const queryClient = useQueryClient();

   useEffect(() => {
      queryClient.removeQueries({ queryKey: ["channels"] });
      queryClient.removeQueries({ queryKey: ["messages"] });
      queryClient.removeQueries({ queryKey: ["relationships"] });
   }, []);
   return (
      <div className="absolute inset-0">
         <div className="absolute flex h-full w-full items-center justify-center">
            <Outlet />
         </div>
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
