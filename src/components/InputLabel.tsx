import { ReactElement } from "react";

export default function InputLabel(props: {
   status: InputStatus;
   required: boolean;
   inputId: string;
   children: ReactElement | string;
}) {
   return (
      <label
         htmlFor={props.inputId}
         className={`mb-2 select-none text-sm font-medium uppercase opacity-90 ${props.status.code === "none" ? "text-text" : "text-error"}`}
      >
         {props.children}
         {props.status.text ? (
            <span className={`text-error ${props.status.text && "font-normal normal-case italic"}`}>
               <span className="px-0.5">-</span>
               {props.status.text}
            </span>
         ) : props.required ? (
            <span className="pl-0.5 text-error">*</span>
         ) : null}
      </label>
   );
}
