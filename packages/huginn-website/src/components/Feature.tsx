import { useEffect, useRef, useState } from "react";

import type { IconComponent } from "@/types";

type FeatureProps = {
   header: string;
   text: string;
   icon: IconComponent;
};

export default function Feature({ header, text, icon }: FeatureProps) {
   const IconComponent = icon;
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
      <div ref={containerRef} className="w-full lg:h-64 lg:w-152">
         <div
            className={`group border-text/20 border-b-primary-500 bg-surface-alt hover:border-text hover:border-b-primary-700 hover:bg-surface-deep/70 h-full w-full rounded-2xl border-2 border-b-4 p-6 shadow-md transition-all duration-500 hover:-translate-y-2 hover:scale-105 hover:shadow-xl ${
               isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
            }`}
         >
            <div className="flex flex-row items-center space-x-5 rounded-2xl">
               <div className="bg-primary-900 rounded-xl p-3 transition-all duration-500">
                  <IconComponent className="text-primary-500 size-10" />
               </div>
               <div className="text-primary-500 text-xl font-bold lg:text-2xl">{header}</div>
            </div>

            <div className="mt-6 text-lg">{text}</div>
         </div>
      </div>
   );
}
