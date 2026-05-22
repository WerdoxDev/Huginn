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
        className={`group h-full w-full rounded-2xl border-2 border-b-4 border-text/20 border-b-primary bg-secondary p-6 shadow-md transition-all duration-500 ease hover:-translate-y-2 hover:scale-105 hover:border-text/50 hover:border-b-accent hover:bg-tertiary/70 hover:shadow-xl ${
          isVisible ? "translate-y-0 opacity-100" : "translate-y-6 opacity-0"
        }`}
      >
        <div className="flex flex-row items-center space-x-5 rounded-2xl">
          <div className="rounded-xl bg-accent/10 p-3 transition-all group-hover:bg-accent/20">
            <Icon icon={icon} className="size-10 text-accent" />
          </div>
          <div className="text-xl font-bold text-accent md:text-2xl">{header}</div>
        </div>

        <div className="mt-6 text-lg">{text}</div>
      </div>
    </div>
  );
}
