import { HuginnInputProps, InputStatus } from "@/types";
import { useInputBorder } from "@hooks/useInputBorder";
import { snowflake } from "@huginn/shared";
import clsx from "clsx";
import { HTMLInputTypeAttribute, MutableRefObject, ReactNode, createContext, useContext, useRef, useState } from "react";

const InputContext = createContext<{
   id: string;
   status: InputStatus;
   value?: string;
   required?: boolean;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   inputRef?: MutableRefObject<HTMLInputElement | null>;
   onChange?: (e: HTMLInputElement) => void;
   onFocusChange?: (focused: boolean) => void;
}>({
   id: "",
   status: { code: "none", text: "" },
});

export default function HuginnInput(props: HuginnInputProps) {
   const [id, _setId] = useState(() => snowflake.generateString());
   const inputRef = useRef<HTMLInputElement>(null);

   return (
      <InputContext.Provider
         value={{
            id: id,
            value: props.value,
            required: props.required,
            status: props.status,
            placeholder: props.placeholder,
            type: props.type,
            inputRef: inputRef,
            onChange: props.onChange,
            onFocusChange: props.onFocusChanged,
         }}
      >
         <div className={clsx(!props.headless && "flex flex-col", props.className)}>{props.children}</div>
      </InputContext.Provider>
   );
}

function Input(props: { headless?: boolean; className?: string }) {
   const inputContext = useContext(InputContext);

   return (
      <input
         id={inputContext.id}
         value={inputContext.value}
         ref={inputContext.inputRef}
         className={clsx(
            !props.headless && "placeholder-text/60 flex-grow bg-transparent p-2 text-white outline-none",
            props.className,
         )}
         type={inputContext.type ?? "text"}
         autoComplete="new-password"
         placeholder={inputContext.placeholder}
         onChange={e => inputContext.onChange?.(e.target)}
         onFocus={() => inputContext.onFocusChange?.(true)}
         onBlur={() => inputContext.onFocusChange?.(false)}
      />
   );
}

function Wrapper(props: {
   className?: string;
   headless?: boolean;
   border?: "left" | "right" | "top" | "bottom";
   children?: ReactNode;
}) {
   const inputContext = useContext(InputContext);
   const { hasBorder, borderColor } = useInputBorder(inputContext.status);

   return (
      <div
         className={clsx(
            props.className,
            !props.headless && "bg-secondary flex w-full items-center rounded-md",
            hasBorder &&
               ((props.border === "top" && "border-t-4") ||
                  (props.border === "bottom" && "border-b-4") ||
                  (props.border === "left" && "border-l-4") ||
                  (props.border === "right" && "border-r-4")),
            hasBorder && props.border && borderColor,
         )}
      >
         {props.children}
      </div>
   );
}

function Label(props: { children?: ReactNode; headless?: boolean; className?: string; text: string; hideAdditional?: boolean }) {
   const inputContext = useContext(InputContext);

   return (
      <label
         htmlFor={inputContext.id}
         className={clsx(
            !props.headless && "select-none text-xs font-medium uppercase opacity-90",
            inputContext.status.code === "none" ? "text-text" : "text-error",
            props.className,
         )}
      >
         {props.text}
         {!props.hideAdditional &&
            (inputContext.status.text ? (
               <span className={clsx("text-error", inputContext.status.text && "font-normal normal-case italic")}>
                  <span className="px-0.5">-</span>
                  {inputContext.status.text}
               </span>
            ) : (
               inputContext.required && <span className="text-error pl-0.5">*</span>
            ))}
      </label>
   );
}

HuginnInput.Label = Label;
HuginnInput.Wrapper = Wrapper;
HuginnInput.Input = Input;
HuginnInput.InputContext = InputContext;
