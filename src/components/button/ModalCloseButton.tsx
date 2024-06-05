import { ReactNode } from "@tanstack/react-router";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void }) {
   return (
      <button
         className="absolute right-2.5 top-2.5 flex h-7 w-7 items-center justify-center rounded-md bg-secondary hover:bg-tertiary"
         onClick={props.onClick}
      >
         <IconMdiClose className="h-5 w-5 text-error" />
         {props.children}
      </button>
   );
}
