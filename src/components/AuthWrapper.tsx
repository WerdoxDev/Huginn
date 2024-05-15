import { ReactNode } from "react";

export default function AuthWrapper(props: { children?: ReactNode; hidden: boolean; onSubmit: () => void }) {
   return (
      !props.hidden && (
         <form
            onSubmit={(e) => {
               e.preventDefault();
               props.onSubmit();
            }}
            className="flex w-96 flex-col items-start rounded-lg bg-background p-5 shadow-xl transition-shadow hover:shadow-2xl"
         >
            {props.children}
         </form>
      )
   );
}
