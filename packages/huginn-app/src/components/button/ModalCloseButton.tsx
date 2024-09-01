import { ReactNode } from "@tanstack/react-router";

export default function ModalCloseButton(props: { children?: ReactNode; onClick: () => void }) {
   return (
      <button
         className="bg-secondary hover:bg-tertiary absolute right-2 top-2 flex h-7 w-7 items-center justify-center rounded-md"
         onClick={props.onClick}
      >
         <IconMdiClose className="text-error h-5 w-5" />
         {props.children}
      </button>
   );
}
