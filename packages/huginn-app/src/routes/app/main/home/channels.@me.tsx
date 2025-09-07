import HuginnIcon from "@components/HuginnIcon";
import QuickActionButton from "@components/button/QuickActionButton";
import { useModals } from "@stores/modalsStore";
import { NavLink, useNavigate } from "react-router";

export default function ChannelMe() {
   const { updateModals } = useModals();
   const navigate = useNavigate();

   return (
      <div className="flex h-full flex-col">
         <div className="flex h-full flex-col items-center justify-center gap-y-5">
            <div className="text-text flex max-w-md flex-col items-center text-center">
               <div className="bg-surface mb-2.5 rounded-xl p-5 shadow-lg">
                  <HuginnIcon
                     outlined
                     // overrideTheme="text"
                     className="text-primary-500 size-20 transition-transform hover:-rotate-12 hover:scale-105 active:rotate-6"
                  />
               </div>
               <div className="mb-2.5 text-2xl font-bold">Welcome to Huginn</div>
               <div>
                  Start by adding your friends in the{" "}
                  <NavLink to="/friends" className="text-primary-500 font-bold">
                     FRIENDS
                  </NavLink>{" "}
                  section or select one of these <span className="text-text/80 font-semibold">Quick Actions</span>!
               </div>
            </div>
            <div className="flex gap-2">
               <QuickActionButton onClick={() => updateModals({ createDM: { isOpen: true } })}>Create Direct Message</QuickActionButton>
               <QuickActionButton onClick={() => navigate("/friends")}>Add a Friend</QuickActionButton>
            </div>
         </div>
         <div className="bg-surface flex h-16 w-full shrink-0" />
      </div>
   );
}
