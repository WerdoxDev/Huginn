import { createFileRoute, useMatch, useMatches } from "@tanstack/react-router";
import { AnimatePresence } from "framer-motion";
import AnimatedOutlet from "../components/AnimaredOutlet";

export const Route = createFileRoute("/_layoutAnimation")({
   component: LayoutAnimation,
});

function LayoutAnimation() {
   const matches = useMatches();
   const match = useMatch({ strict: false });
   const nextMatchIndex = matches.findIndex((d) => d.id === match.id) + 1;
   const nextMatch = matches[nextMatchIndex];

   return (
      <AnimatePresence mode="sync" initial={false}>
         <AnimatedOutlet key={nextMatch.id} animate={{ opacity: [0, 1] }} exit={{ opacity: 0 }} transition={{ duration: 3 }} />
      </AnimatePresence>
   );
}
