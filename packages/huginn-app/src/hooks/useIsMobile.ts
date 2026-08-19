import { isChildWindow } from "@lib/child-window";
import { useState, useEffect } from "react";

export function useIsMobile() {
   const [isMobile, setIsMobile] = useState(checkMobile());

   useEffect(() => {
      function checkAndSet() {
         setIsMobile(checkMobile());
      }

      window.addEventListener("resize", checkAndSet);
      return () => window.removeEventListener("resize", checkAndSet);
   }, []);

   function checkMobile() {
      return window.innerWidth < 1024 && !isChildWindow();
   }

   return isMobile;
}
