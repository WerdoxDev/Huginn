import { Icon } from "@iconify/react";
import { useEffect, useRef, useState } from "react";

type FeatureProps = {
   header: string;
   text: string;
   icon: string;
};

export default function Feature({ header, text, icon }: FeatureProps) {
   const containerRef = useRef<HTMLDivElement | null>(null);
   const [isVisible, setIsVisible] = useState(false);

   useEffect(() => {
      const target = containerRef.current;
      if (!target || isVisible) return;

      const observer = new IntersectionObserver(
         (entries) => {
            const [entry] = entries;
            if (entry?.isIntersecting) {
               setIsVisible(true);
               observer.disconnect();
            }
         },
         { threshold: 0.2 },
      );

      observer.observe(target);

      return () => {
         observer.disconnect();
      };
   }, [isVisible]);

   return (
      <div ref={containerRef} className="w-full md:h-64 md:w-[38rem]">
         <div
            className={`group border-text/20 border-b-primary bg-secondary ease hover:border-text/50 hover:border-b-accent hover:bg-tertiary/70 h-full w-full rounded-2xl border-2 border-b-4 p-6 shadow-md transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-xl ${
               isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
         >
            <div className="flex flex-row items-center space-x-5 rounded-2xl">
               <div className="bg-accent/10 group-hover:bg-accent/20 rounded-xl p-3 transition-all">
                  <Icon icon={icon} className="text-accent size-10" />
               </div>
               <div className="text-accent text-xl font-bold md:text-2xl">{header}</div>
            </div>

            <div className="mt-6 text-lg">{text}</div>
         </div>
      </div>
   );
}
