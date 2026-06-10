import { useEffect, useState } from "react";

export function useIsFocused(ref: React.RefObject<HTMLElement | null>) {
   const [isFocused, setIsFocused] = useState(false);

   useEffect(() => {
      const handleFocus = () => setIsFocused(true);
      const handleBlur = () => setIsFocused(false);

      const element = ref.current;
      if (element) {
         element.addEventListener("focus", handleFocus);
         element.addEventListener("blur", handleBlur);
      }

      return () => {
         if (element) {
            element.removeEventListener("focus", handleFocus);
            element.removeEventListener("blur", handleBlur);
         }
      };
   }, [ref]);

   return isFocused;
}
