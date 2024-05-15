import { getRouterContext, Outlet } from "@tanstack/react-router";
import { HTMLMotionProps, motion, useIsPresent } from "framer-motion";
import cloneDeep from "lodash.clonedeep";
import { useContext, useRef } from "react";

export default function AnimatedOutlet(props: HTMLMotionProps<"div">) {
   const RouterContext = getRouterContext();

   const routerContext = useContext(RouterContext);

   const renderedContext = useRef(routerContext);

   const isPresent = useIsPresent();

   if (isPresent) {
      //   renderedContext.current =  cloneDeep(routerContext);
      renderedContext.current = cloneDeep(routerContext);
   }

   return (
      <motion.div {...props} className="absolute flex h-full w-full items-center justify-center">
         <RouterContext.Provider value={renderedContext.current}>
            <Outlet />
         </RouterContext.Provider>
      </motion.div>
   );
}
