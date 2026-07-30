import type { Snowflake } from "@huginnjs/shared";
import type { RefObject } from "react";

import { motion, type Transition, type Variants } from "motion/react";

export default function VoicePreviewVideo(props: {
   userId: Snowflake;
   gridElementWidth: number;
   onClick?: () => void;
   ref?: RefObject<HTMLDivElement>;
   isResizing?: boolean;
}) {
   const transition: Transition = { type: "spring", bounce: 0, damping: 26, stiffness: 200 };

   const variants: Variants = {
      visible: {
         scale: 1,
         opacity: 1,
         transition,
      },
      hidden: { scale: 0, opacity: 0, transition },
      exit: { scale: 0, opacity: 0, transition },
   };

   return (
      <motion.div
         layout={!props.isResizing}
         variants={variants}
         transition={transition}
         initial="hidden"
         animate="visible"
         exit="exit"
         ref={props.ref}
         className="bg-surface flex aspect-video items-center justify-center rounded-xl"
         style={{ width: props.gridElementWidth }}
      >
         <button
            onClick={props.onClick}
            type="button"
            className="border-text/80 bg-surface-alt text-text hover:bg-surface-deep cursor-pointer rounded-lg border px-4 py-2 shadow-xl transition-colors"
         >
            Watch
         </button>
      </motion.div>
   );
}
