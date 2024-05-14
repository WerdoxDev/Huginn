import { snowflake } from "@shared/snowflake";
import { useRef, useEffect, HTMLInputTypeAttribute, createContext, useContext, ReactElement } from "react";
import useInputBorder from "../hooks/useInputBorder";
import InputLabel from "./InputLabel";
import React from "react";

const InputContext = createContext<{ id: string; status: InputStatus; required?: boolean }>({
   id: "",
   status: { code: "none", text: "" },
   required: false,
});

export default function HuginnInput(props: {
   status: InputStatus;
   type?: HTMLInputTypeAttribute;
   required?: boolean;
   value?: string;
   children?: React.ReactElement;
   onChange?: (e: HTMLInputElement) => void;
   onFocus?: (focused: boolean) => void;
}) {
   const inputRef = useRef<HTMLInputElement>(null);
   // console.log(props.state);
   const { hasBorder, borderColor } = useInputBorder(props.status);
   const id = snowflake.generate();

   useEffect(() => {
      if (inputRef.current) {
         inputRef.current.value = props.value || "";
      }
   }, [props.value]);

   return (
      <InputContext.Provider value={{ id: id, required: props.required, status: props.status }}>
         {props.children}
         <div className="flex flex-col">
            <div className={`flex w-full items-center rounded-md bg-secondary ${hasBorder ? "border-l-4" : ""} ${borderColor}`}>
               <input
                  id={id}
                  ref={inputRef}
                  className="flex-grow bg-transparent p-2.5 text-white outline-none"
                  type={props.type}
                  autoComplete="new-password"
                  placeholder=""
                  onChange={(e) => props.onChange && props.onChange(e.target)}
                  onFocus={() => props.onFocus && props.onFocus(true)}
                  onBlur={() => props.onFocus && props.onFocus(false)}
               />
            </div>
         </div>
      </InputContext.Provider>
   );
}

const Label = (props: { children: string | ReactElement }) => {
   const inputContext = useContext(InputContext);

   return (
      <InputLabel inputId={inputContext.id} status={inputContext.status} required={inputContext.required || false}>
         {props.children}
      </InputLabel>
   );
};

HuginnInput.Label = Label;
