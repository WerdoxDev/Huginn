import { animated, useInView } from "@react-spring/web";
import { Outlet, getRouterContext, useRouter } from "@tanstack/react-router";
import cloneDeep from "lodash.clonedeep";
import { useEffect, useRef } from "react";

export default function AnimatedOutlet(props: {
   updateFor?: string[];
   test: string;
   style: Record<string, unknown>;
   className?: string;
}) {
   const router = useRouter();
   const RouterContext = getRouterContext();

   const renderedContext = useRef(router);

   const [ref, inView] = useInView();

   // useEffect(() => {
   //    console.log("changed");
   //    if (!props.isRoot) {
   //       renderedContext.current = cloneDeep(animatedRouterContext.context);
   //    }
   // }, [animatedRouterContext.context.state.location.pathname]);

   useEffect(() => {
      console.log(`Changing... ${props.test} ${router.state.location.pathname} ${renderedContext.current.state.location.pathname}`);
      // const matches = router.state.
      // THIS IS THE PROBBBBBBLEM
      console.log(router.state.location);
      if (props.updateFor?.includes(router.state.location.pathname)) {
         // renderedContext.current = cloneDeep(router);
      }
      // if (props.isRoot) {
      //    animatedRouterContext.setContext(router);
      // }
   }, [router.state.location.pathname]);

   useEffect(() => {
      if (inView) {
         renderedContext.current = cloneDeep(router);
      }
      console.log("Changed" + " " + props.test);
   }, [inView]);

   useEffect(() => {
      return () => {
         console.log(`unmount ${props.test}`);
      };
   }, []);

   function onClick() {
      console.log(router.state.location.pathname);
      renderedContext.current = cloneDeep(router);
   }

   // // const isPresent = useIsPresent();

   // const matches = useMatches();
   // const prevMatches = useRef(matches);

   // const RouterContext = getRouterContext();
   // const actualRouterContext = useContext(RouterContext);

   // let renderedContext = actualRouterContext;

   // useEffect(() => {
   //    if (inView) {
   //       console.log(inView);
   //       prevMatches.current = cloneDeep(matches);
   //    } else {
   //       renderedContext = cloneDeep(actualRouterContext);
   //       renderedContext.__store.state.matches = [
   //          ...matches.map((m, i) => ({
   //             ...(prevMatches.current[i] || m),
   //             id: m.id,
   //          })),
   //          ...prevMatches.current.slice(matches.length),
   //       ];
   //    }
   // }, [inView]);

   return (
      <>
         <button className="absolute z-20 text-text" onClick={() => onClick()}>
            Test {props.test}
         </button>
         <animated.div ref={ref} style={props.style} className={props.className}>
            <RouterContext.Provider value={renderedContext.current}>
               <Outlet />
            </RouterContext.Provider>
         </animated.div>
      </>
   );
}
