import { useState, useEffect } from "react";

export function useIsMobile() {
   const [isMobile, setIsMobile] = useState(false);

   useEffect(() => {
      function checkMobile() {
         setIsMobile(window.innerWidth < 1024);
      }

      checkMobile();
      window.addEventListener("resize", checkMobile);

      return () => window.removeEventListener("resize", checkMobile);
   }, []);

   return isMobile;
}
