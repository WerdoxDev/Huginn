import { useEffect, useRef, useState } from "react";

export function useContainerWidth() {
   const ref = useRef<HTMLDivElement | null>(null);
   const [width, setWidth] = useState(0);

   useEffect(() => {
      if (!ref.current) return;
      const el = ref.current;
      const observer = new ResizeObserver((entries) => {
         for (const entry of entries) {
            setWidth(entry.contentRect.width);
         }
      });
      observer.observe(el);
      setWidth(el.getBoundingClientRect().width);
      return () => observer.disconnect();
   }, []);

   return [ref, width] as const;
}
