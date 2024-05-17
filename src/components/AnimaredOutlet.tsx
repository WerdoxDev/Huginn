import { getRouterContext, Outlet, useMatches } from "@tanstack/react-router";
import { HTMLMotionProps, motion, useIsPresent } from "framer-motion";
import cloneDeep from "lodash.clonedeep";
import { useContext, useEffect, useRef } from "react";

export default function AnimatedOutlet(props: HTMLMotionProps<"div">) {
   const RouterContext = getRouterContext();

   const routerActualContext = useContext(RouterContext);

   const renderedContext = useRef(routerActualContext);

   const isPresent = useIsPresent();

   useEffect(() => {
      if (isPresent) {
         renderedContext.current = cloneDeep(routerActualContext);
      }
   }, [isPresent]);

   // const isPresent = useIsPresent();

   // const matches = useMatches();
   // const prevMatches = useRef(matches);

   // const RouterContext = getRouterContext();
   // const actualRouterContext = useContext(RouterContext);

   // let renderedContext = actualRouterContext;

   // if (isPresent) {
   //    console.log(isPresent);
   //    prevMatches.current = cloneDeep(matches);
   // } else {
   //    renderedContext = cloneDeep(actualRouterContext);
   //    renderedContext.__store.state.matches = [
   //       ...matches.map((m, i) => ({
   //          ...(prevMatches.current[i] || m),
   //          id: m.id,
   //       })),
   //       ...prevMatches.current.slice(matches.length),
   //    ];
   // }

   return (
      <motion.div {...props} className="absolute flex h-full w-full items-center justify-center">
         <RouterContext.Provider value={renderedContext.current}>
            <Outlet />
         </RouterContext.Provider>
      </motion.div>
   );
}
