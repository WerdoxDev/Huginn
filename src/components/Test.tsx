import { AnimatePresence, motion } from "framer-motion";
import { useRef, useState } from "react";

export default function Test() {
   const data = useRef(["hi", "hah?"]);
   const [index, setIndex] = useState(0);

   function onChange() {
      setIndex((index + 1) % data.current.length);
   }
   return (
      <div className="absolute z-30 bg-white">
         <button onClick={() => onChange()}>Change</button>
         <AnimatePresence mode="sync">
            <motion.div
               initial={{ opacity: 0 }}
               animate={{ opacity: 1 }}
               exit={{ opacity: 0 }}
               transition={{ duration: 2, ease: "circInOut" }}
               key={data.current[index]}
            >
               {data.current[index]}
            </motion.div>
         </AnimatePresence>
      </div>
   );
}
