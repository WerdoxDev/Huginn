import { getRouterContext, Outlet } from "@tanstack/react-router";
import { HTMLMotionProps, motion, useIsPresent } from "framer-motion";
import cloneDeep from "lodash.clonedeep";
import { useContext, useEffect, useRef } from "react";

export default function AnimatedOutlet(props: HTMLMotionProps<"div">) {
   const RouterContext = getRouterContext();

   const routerActualContext = useContext(RouterContext);

   const renderedContext = useRef(routerActualContext);

   const isPresent = useIsPresent();

   useEffect(() => {
      console.log("present?");
      if (isPresent) {
         renderedContext.current = cloneDeep(routerActualContext);
      }
   }, [isPresent]);

   return (
      <motion.div {...props} className="absolute flex h-full w-full items-center justify-center">
         <RouterContext.Provider value={renderedContext.current}>
            <Outlet />
         </RouterContext.Provider>
      </motion.div>
   );
}
