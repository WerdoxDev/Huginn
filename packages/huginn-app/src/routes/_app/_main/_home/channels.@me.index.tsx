import MobileMenuButton from "@components/button/MobileMenuButton";
import QuickActionButton from "@components/button/QuickActionButton";
import HuginnIcon from "@components/HuginnIcon";
import TopBar from "@components/TopBar";
import { useIsMobile } from "@hooks/useIsMobile";
import { useModals } from "@stores/modalsStore";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/_main/_home/channels/@me/")({
   component: ChannelMeComponent,
});

function ChannelMeComponent() {
   const { updateModals } = useModals();
   const navigate = useNavigate();
   const isMobile = useIsMobile();

   return (
      <div className="flex h-full flex-col">
         <TopBar>{isMobile && <MobileMenuButton />}</TopBar>
         <div className="flex h-full flex-col items-center justify-center gap-y-5 px-2">
            <div className="text-text flex max-w-md flex-col items-center text-center">
               <div className="bg-surface mb-2.5 rounded-xl p-5 shadow-lg">
                  <HuginnIcon outlined className="text-primary-500 size-20 transition-transform hover:scale-105 hover:-rotate-12 active:rotate-6" />
               </div>
               <div className="mb-2.5 text-2xl font-bold">Welcome to Huginn</div>
               <div>
                  Start by adding your friends in the{" "}
                  <Link to="/friends" className="text-primary-500 font-bold">
                     FRIENDS
                  </Link>{" "}
                  section or select one of these <span className="text-text/80 font-semibold">Quick Actions</span>!
               </div>
            </div>
            <div className="flex w-full flex-wrap items-center justify-center gap-2 lg:flex-nowrap">
               <QuickActionButton onClick={() => updateModals({ createDM: { isOpen: true } })}>Create Direct Message</QuickActionButton>
               <QuickActionButton onClick={() => navigate({ to: "/friends" })}>Add a Friend</QuickActionButton>
            </div>
         </div>
         <div className="bg-surface flex h-16 w-full shrink-0" />
      </div>
   );
}
