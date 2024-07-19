import { HuginnInputProps, InputStatus } from "@/types";
import { useInputBorder } from "@hooks/useInputBorder";
import { filterChildrenOfType } from "@lib/utils";
import { snowflake } from "@shared/snowflake";
import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

const InputContext = createContext<{ id: string; status: InputStatus; required?: boolean }>({
   id: "",
   status: { code: "none", text: "" },
   required: false,
});

export default function HuginnInput(props: HuginnInputProps) {
   const inputRef = useRef<HTMLInputElement>(null);
   // console.log(props.state);
   const { hasBorder, borderColor } = useInputBorder(props.status);
   const [id, _setId] = useState(() => snowflake.generateString());

   const filteredChildren = useMemo(() => {
      return {
         label: filterChildrenOfType(props.children, Label),
         action: filterChildrenOfType(props.children, Action),
         after: filterChildrenOfType(props.children, After),
      };
   }, [props.children]);

   useEffect(() => {
      if (inputRef.current) {
         inputRef.current.value = props.value ?? "";
      }
   }, [props.value]);

   return (
      <InputContext.Provider value={{ id: id, required: props.required, status: props.status }}>
         <div className={`flex flex-col ${props.className}`}>
            {filteredChildren.label && <HuginnInput.Label skipRender>{filteredChildren.label}</HuginnInput.Label>}
            <div
               className={`flex w-full items-center rounded-md bg-secondary ${hasBorder && !props.hideBorder ? "border-l-4" : ""} ${borderColor}`}
            >
               <input
                  id={id}
                  ref={inputRef}
                  className="flex-grow bg-transparent p-2.5 text-white outline-none"
                  type={props.type ?? "text"}
                  autoComplete="new-password"
                  placeholder=""
                  onChange={(e) => props.onChange && props.onChange(e.target)}
                  onFocus={() => props.onFocus && props.onFocus(true)}
                  onBlur={() => props.onFocus && props.onFocus(false)}
               />
               {filteredChildren.action && <HuginnInput.Action>{filteredChildren.action}</HuginnInput.Action>}
            </div>
            {filteredChildren.after && <HuginnInput.After>{filteredChildren.after}</HuginnInput.After>}
         </div>
      </InputContext.Provider>
   );
}

function Label(props: { children?: ReactNode; skipRender?: boolean }) {
   const inputContext = useContext(InputContext);
   return !props.skipRender ? (
      <label
         htmlFor={inputContext.id}
         className={`mb-2 select-none text-xs font-medium uppercase opacity-90 ${inputContext.status.code === "none" ? "text-text" : "text-error"}`}
      >
         {props.children}
         {inputContext.status.text ? (
            <span className={`text-error ${inputContext.status.text && "font-normal normal-case italic"}`}>
               <span className="px-0.5">-</span>
               {inputContext.status.text}
            </span>
         ) : (
            inputContext.required && <span className="pl-0.5 text-error">*</span>
         )}
      </label>
   ) : (
      props.children
   );
}

function Action(props: { children?: ReactNode }) {
   return props.children;
}

function After(props: { children?: ReactNode }) {
   return props.children;
}

HuginnInput.Label = Label;
HuginnInput.Action = Action;
HuginnInput.After = After;
