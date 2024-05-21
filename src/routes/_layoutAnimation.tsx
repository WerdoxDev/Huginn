import { useTransition } from "@react-spring/web";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import AnimatedOutlet from "../components/AnimatedOutlet";
import { AuthBackgroundContext } from "../contexts/authBackgroundContext";

export const Route = createFileRoute("/_layoutAnimation")({
   component: LayoutAnimation,
});

function LayoutAnimation() {
   const router = useRouter();
   const [id, setId] = useState(() => getState());
   const [backgroundState, setBackgroundState] = useState(2);

   const transitions = useTransition(id, {
      from: { dummy: 0 },
      enter: { dummy: 1 },
      leave: { dummy: 0 },
      config: { duration: 500 },
   });

   function getState() {
      return (
         router.state.matches.find((x) => x.id === "/_layoutAnimation/_layoutAuth" || x.id === "/_layoutAnimation/_layoutMain")?.id ??
         ""
      );
   }

   useEffect(() => {
      setId(getState());
   }, [router.state.matches]);

   return (
      // <div>
      <>
         <AuthBackgroundContext.Provider value={{ state: backgroundState, setState: setBackgroundState }}>
            {transitions((style) => (
               // <animated.div style={style}>
               <AnimatedOutlet
                  updateFor={["/login", "/register"]}
                  style={style}
                  test="animation layout"
                  className={`absolute inset-0 top-6`}
               />
               // <Outlet />
               // </animated.div>
            ))}
            {/* <Outlet /> */}
            {/* <AnimatedOutlet transition={transitions} test="animation layout" /> */}
         </AuthBackgroundContext.Provider>
      </>
      // </div>
   );

   //  return <Outlet />;
}
