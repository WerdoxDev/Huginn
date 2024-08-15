import { HuginnInputProps, InputStatus } from "@/types";
import { useInputBorder } from "@hooks/useInputBorder";
import { filterChildrenOfType } from "@lib/utils";
import { snowflake } from "@huginn/shared";
import { ReactNode, createContext, useContext, useEffect, useMemo, useRef, useState } from "react";
import clsx from "clsx";

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

   const border = useMemo(
      () =>
         props.border === "top"
            ? "border-t-4"
            : props.border === "right"
              ? "border-r-4"
              : props.border === "bottom"
                ? "border-b-4"
                : props.border === "left"
                  ? "border-l-4"
                  : props.border === "none"
                    ? "border-none "
                    : "border-l-4",
      [props.border],
   );

   useEffect(() => {
      if (inputRef.current) {
         inputRef.current.value = props.value ?? "";
      }
   }, [props.value]);

   return (
      <InputContext.Provider value={{ id: id, required: props.required, status: props.status }}>
         <div className={clsx("flex flex-col", props.className)}>
            {filteredChildren.label && <HuginnInput.Label skipRender>{filteredChildren.label}</HuginnInput.Label>}
            <div
               className={clsx(
                  props.inputProps?.className,
                  "bg-secondary flex w-full items-center rounded-md",
                  hasBorder && border,
                  borderColor,
               )}
            >
               <input
                  id={id}
                  ref={inputRef}
                  className="flex-grow bg-transparent p-2 text-white outline-none"
                  type={props.type ?? "text"}
                  autoComplete="new-password"
                  placeholder=""
                  onChange={e => props.onChange && props.onChange(e.target)}
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
            inputContext.required && <span className="text-error pl-0.5">*</span>
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
