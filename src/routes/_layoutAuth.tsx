import { createFileRoute, useMatch, useMatches } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import { useState } from "react";
import AnimatedOutlet from "../components/AnimaredOutlet";
import AuthBackgroundSvg from "../components/AuthBackgroundSvg";
import { AuthBackgroundContext } from "../contexts/authBackgroundContext";

export const Route = createFileRoute("/_layoutAuth")({
   component: LayoutAuth,
});

function LayoutAuth() {
   const matches = useMatches();
   const match = useMatch({ strict: false });
   const nextMatchIndex = matches.findIndex((d) => d.id === match.id) + 1;
   const nextMatch = matches[nextMatchIndex];

   const [backgroundState, setBackgroundState] = useState(2);
   return (
      <AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
         <div className={`absolute inset-0 top-6 z-10 bg-secondary ${backgroundState === 2 && "pointer-events-none"}`}>
            <AuthBackgroundSvg />
            <div
               className={`absolute inset-0 select-none transition-all duration-500 ${backgroundState === 1 ? "opacity-100" : "opacity-0"}`}
            >
               <div className="flex h-full items-center justify-center text-xl font-medium text-text opacity-60">
                  <span>Loading</span>
                  <span className="loader__dot">.</span>
                  <span className="loader__dot">.</span>
                  <span className="loader__dot">.</span>
               </div>
            </div>
            <AnimatePresence mode="sync">
               <AnimatedOutlet
                  initial={{ y: -120, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  exit={{ y: -120, opacity: 0 }}
                  transition={{ ease: "circInOut" }}
                  key={nextMatch.id}
               />
            </AnimatePresence>
            {/* <Transition appear name="fade">
            <button
               v-if="backgroundState !== 2"
               className="absolute bottom-2.5 right-2.5 rounded-lg p-1 transition-all hover:bg-background"
               @click="openModal"
            >
               <Icon name="mdi:settings" className="text-white/80 transition-all hover:rotate-[60deg]" size="24" />
            </button>
         </Transition> */}
         </div>
      </AuthBackgroundContext.Provider>
   );
}
