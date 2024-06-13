import { Outlet, createFileRoute } from "@tanstack/react-router";
import { useContext, useEffect } from "react";
import GuildsBar from "../../components/GuildsBar";
import { AuthBackgroundContext } from "../../contexts/authBackgroundContext";
import { useServerErrorHandler } from "../../hooks/useServerErrorHandler";
import MessageProvider from "../../components/MessageProvider";
import FriendsProvider from "../../components/FriendsProvider";

export const Route = createFileRoute("/_layoutAnimation/_layoutMain")({
   component: LayoutMain,

   errorComponent: ErrorComponent,
});

function ErrorComponent(props: { error: unknown }) {
   const handleServerError = useServerErrorHandler();

   useEffect(() => {
      handleServerError(props.error);
   }, []);

   return <div className="h-full w-full bg-secondary"></div>;
}

function LayoutMain() {
   const { setState: setBackgroundState } = useContext(AuthBackgroundContext);

   useEffect(() => {
      setBackgroundState(2);
   }, []);

   return (
      <div className="absolute inset-0 overflow-hidden">
         <div className="flex h-full w-full select-none bg-background">
            <MessageProvider>
               <FriendsProvider>
                  <GuildsBar />
                  <Outlet />
               </FriendsProvider>
            </MessageProvider>
         </div>
      </div>
   );
}
