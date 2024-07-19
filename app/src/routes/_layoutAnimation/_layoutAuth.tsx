import AnimatedOutlet from "@components/AnimatedOutlet";
import AuthBackgroundSvg from "@components/AuthBackgroundSvg";
import { AuthBackgroundContext } from "@contexts/authBackgroundContext";
import { routeHistory } from "@contexts/historyContext";
import { useModalsDispatch } from "@contexts/modalContext";
import { animated, easings, useSpring, useTransition } from "@react-spring/web";
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useContext } from "react";

export const Route = createFileRoute("/_layoutAnimation/_layoutAuth")({
   component: LayoutAuth,
});

function LayoutAuth() {
   const router = useRouter();
   const { state: backgroundState } = useContext(AuthBackgroundContext);
   const transitions = useTransition(router.state.location.pathname, {
      from: { opacity: 0, transform: "translateY(-120px)" },
      enter: { opacity: 1, transform: "translateY(0px)" },
      leave: { opacity: 0, transform: "translateY(-120px)" },
      config: { duration: 250, easing: easings.easeInOutCirc },
   });

   const modalsDispatch = useModalsDispatch();

   const style = useSpring({
      background: backgroundState === 2 ? "rgba(38,38,38,0)" : "rgba(38,38,38,1)",
      config: { duration: 250 },
      immediate: !routeHistory.lastPathname,
   });

   return (
      <animated.div style={style} className={`absolute inset-0 z-10 ${backgroundState === 2 && "pointer-events-none"}`}>
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
         {transitions((style) => (
            <AnimatedOutlet style={style} className="absolute flex h-full w-full items-center justify-center" test="auth" />
         ))}
         {backgroundState !== 2 && (
            <button
               v-if="backgroundState !== 2"
               className="absolute bottom-2.5 right-2.5 rounded-lg p-1 transition-all hover:bg-background"
               onClick={() => modalsDispatch({ settings: { isOpen: true } })}
            >
               <IconMdiSettings className="h-6 w-6 text-white/80 transition-all hover:rotate-[60deg]" />
            </button>
         )}
         {/* <Transition appear name="fade">
            <button
               v-if="backgroundState !== 2"
               className="absolute bottom-2.5 right-2.5 rounded-lg p-1 transition-all hover:bg-background"
               @click="openModal"
            >
               <Icon name="mdi:settings" className="text-white/80 transition-all hover:rotate-[60deg]" size="24" />
            </button>
         </Transition> */}
      </animated.div>
   );
}
