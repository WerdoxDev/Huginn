import HuginnIcon from "@components/HuginnIcon";
import { animate, createScope, Scope } from "animejs";
import { useEffect, useRef } from "react";

export default function RoamingHuginnIcon() {
   const iconRef = useRef<HTMLImageElement>(null);
   // const roamFnRef = useRef<(() => void) | null>(null);
   const currentPosRef = useRef({ x: 0, y: 0 });
   const isHiddenRef = useRef(false);
   const scope = useRef<Scope>(null);

   useEffect(() => {
      if (!iconRef.current) return;

      scope.current = createScope({ root: iconRef.current }).add((self) => {
         self?.add("roam", () => {
            if (isHiddenRef.current || !iconRef.current?.parentElement) return;

            const { offsetWidth: pw, offsetHeight: ph } = iconRef.current.parentElement;
            const targetX = Math.random() * (pw - iconRef.current.offsetWidth);
            const targetY = Math.random() * (ph - iconRef.current.offsetHeight);
            const dx = targetX - currentPosRef.current.x;
            const dy = targetY - currentPosRef.current.y;
            const angle = Math.atan2(dy, dx) * (180 / Math.PI);

            scope.current!.data.roam = animate(iconRef.current, {
               x: targetX,
               y: targetY,
               rotate: angle,
               duration: 4000 + Math.random() * 3000,
               easing: "easeInOutSine",
               onComplete: () => {
                  currentPosRef.current = { x: targetX, y: targetY };
                  scope.current?.methods?.roam?.();
               },
            });
         });

         self?.add("appear", () => {
            if (!iconRef.current?.parentElement) return;

            const { offsetWidth: pw, offsetHeight: ph } = iconRef.current.parentElement;
            const newX = Math.random() * (pw - iconRef.current.offsetWidth);
            const newY = Math.random() * (ph - iconRef.current.offsetHeight);
            currentPosRef.current = { x: newX, y: newY };

            animate(iconRef.current, { x: newX, y: newY, duration: 0 });
            animate(iconRef.current, {
               scale: 1,
               opacity: 0.15,
               duration: 600,
               easing: "easeOutBack",
               onComplete: () => {
                  isHiddenRef.current = false;
                  scope.current?.methods?.roam?.();
               },
            });
         });

         self?.add("disappear", () => {
            if (!iconRef.current) return;

            scope.current?.data.roam.cancel();
            animate(iconRef.current, {
               scale: [1, 1, 1, 0],
               opacity: [0.15, 0.5, 0],
               duration: 500,
               rotate: ["+=0", "+=0", "+=20", "-=20", "+=20", "-=20", "+=20", "-=20"],
               onComplete: () => {
                  setTimeout(() => {
                     scope.current?.methods?.appear?.();
                  }, 4000);
               },
            });
         });
      });

      setTimeout(() => {
         scope.current?.methods?.appear?.();
      }, Math.random() * 60000);

      return () => {
         scope.current?.revert();
      };
   }, []);

   function handleClick() {
      const el = iconRef.current;
      if (!el || isHiddenRef.current) return;
      isHiddenRef.current = true;

      scope.current?.methods?.disappear?.();
   }

   return <HuginnIcon ref={iconRef} outlined className="absolute top-0 left-0 size-5 cursor-pointer opacity-0 select-none" onClick={handleClick} />;
}
