import { HTMLInputTypeAttribute, useMemo, useState } from "react";
import HuginnInput from "./HuginnInput";

export default function PasswordInput(props: HuginnInputProps) {
   const [type, setType] = useState<HTMLInputTypeAttribute>(() => "password");

   const hidden = useMemo(() => type === "password", [type]);

   function toggleType() {
      setType(type === "password" ? "text" : "password");
   }

   return (
      <HuginnInput type={type} {...props}>
         <HuginnInput.Action>
            <button
               className="flex h-full w-11 select-none items-center justify-center border-l-2 border-l-background text-sm text-text"
               type="button"
               onClick={() => toggleType()}
            >
               {hidden ? <IconMdiShow className="h-6 w-6" /> : <IconMdiHide className="h-6 w-6" />}
            </button>
         </HuginnInput.Action>
         {props.children}
      </HuginnInput>
   );
}
