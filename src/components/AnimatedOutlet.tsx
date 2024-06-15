import { routeHistory } from "@contexts/historyContext";
import { animated, useInView } from "@react-spring/web";
import { Outlet, getRouterContext, useRouter } from "@tanstack/react-router";
import cloneDeep from "lodash.clonedeep";
import { useEffect, useRef } from "react";

export default function AnimatedOutlet(props: { updateFor?: string[]; style: Record<string, unknown>; className?: string }) {
   const router = useRouter();
   const RouterContext = getRouterContext();

   const renderedContext = useRef(router);

   const [ref, inView] = useInView();

   useEffect(() => {
      if (
         props.updateFor?.includes(router.state.location.pathname) &&
         (!routeHistory.lastPathname || props.updateFor?.includes(routeHistory.lastPathname))
      ) {
         renderedContext.current = cloneDeep(router);
      } else if (
         props.updateFor &&
         !props.updateFor?.includes(router.state.location.pathname) &&
         routeHistory.lastPathname &&
         !props.updateFor?.includes(routeHistory.lastPathname)
      ) {
         renderedContext.current = cloneDeep(router);
      }
   }, [router.state.location.pathname]);

   useEffect(() => {
      if (inView) {
         renderedContext.current = cloneDeep(router);
      }
   }, [inView]);

   return (
      <animated.div ref={ref} style={props.style} className={props.className}>
         <RouterContext.Provider value={renderedContext.current}>
            <Outlet />
         </RouterContext.Provider>
      </animated.div>
   );
}
