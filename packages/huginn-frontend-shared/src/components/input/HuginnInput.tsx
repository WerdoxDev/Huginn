import clsx from "clsx";
import {
   createContext,
   type ChangeEvent,
   type ComponentPropsWithRef,
   type FocusEvent,
   type HTMLInputTypeAttribute,
   type ReactNode,
   type Ref,
   useContext,
   useId,
   useRef,
} from "react";

import type { HuginnInputMessage, HuginnStatus } from "../../types";

import HuginnLabel from "../HuginnLabel";
import StatusMessage from "../StatusMessage";

export type HuginnInputProps = {
   children?: ReactNode;
   headless?: boolean;
   className?: string;
   message?: HuginnInputMessage;
   hideMessage?: boolean;
   required?: boolean;
   disabled?: boolean;
   value?: string;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   ref?: Ref<HTMLInputElement>;
   name?: string;
   autoFocus?: boolean;
   onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
   onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
   onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
};

type InputContextValue = {
   id: string;
   message: HuginnInputMessage;
   value?: string;
   required?: boolean;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   ref?: Ref<HTMLInputElement>;
   disabled?: boolean;
   name?: string;
   autoFocus?: boolean;
   onChange?: (event: ChangeEvent<HTMLInputElement>) => void;
   onBlur?: (event: FocusEvent<HTMLInputElement>) => void;
   onFocus?: (event: FocusEvent<HTMLInputElement>) => void;
};

const emptyMessage: HuginnInputMessage = { status: "none", text: "" };

const InputContext = createContext<InputContextValue>({ id: "", message: emptyMessage });

export default function HuginnInput(props: HuginnInputProps) {
   const generatedId = useId();
   const inputRef = useRef<HTMLInputElement>(null);
   const message = props.message ?? emptyMessage;

   return (
      <InputContext.Provider
         value={{
            id: generatedId,
            value: props.value,
            required: props.required,
            message,
            placeholder: props.placeholder,
            type: props.type,
            ref: props.ref ?? inputRef,
            disabled: props.disabled,
            name: props.name,
            onChange: props.onChange,
            onBlur: props.onBlur,
            onFocus: props.onFocus,
            autoFocus: props.autoFocus,
         }}
      >
         <div className={clsx(!props.headless && "flex flex-col", props.className)}>
            {props.children}
            {!props.hideMessage ? <StatusMessage status={message.status} text={message.text} visible={message.status !== "none"} /> : null}
         </div>
      </InputContext.Provider>
   );
}

type InputProps = Omit<ComponentPropsWithRef<"input">, "id" | "value" | "disabled" | "type" | "name" | "onChange" | "onBlur" | "onFocus"> & {
   headless?: boolean;
   lowercase?: boolean;
};

function Input({ className, headless, lowercase, ...props }: InputProps) {
   const inputContext = useContext(InputContext);

   function handleChange(event: ChangeEvent<HTMLInputElement>) {
      if (lowercase) event.target.value = event.target.value.toLowerCase();
      inputContext.onChange?.(event);
   }

   return (
      <input
         {...props}
         spellCheck={props.spellCheck ?? false}
         id={inputContext.id}
         value={inputContext.value}
         ref={inputContext.ref}
         className={clsx(
            !headless && "placeholder:text-text/60 h-10 w-full bg-transparent p-2 text-white outline-hidden disabled:cursor-not-allowed",
            className,
         )}
         disabled={inputContext.disabled}
         type={inputContext.type ?? "text"}
         autoFocus={inputContext.autoFocus}
         autoComplete={props.autoComplete ?? "new-password"}
         placeholder={inputContext.placeholder}
         onChange={handleChange}
         onFocus={inputContext.onFocus}
         onBlur={inputContext.onBlur}
         name={inputContext.name}
      />
   );
}

const statusRingColors: Record<HuginnStatus, string> = {
   none: "",
   default: "ring-primary-700",
   error: "ring-negative-300",
   success: "ring-positive-300",
};

function Wrapper({ children, className, headless }: { className?: string; headless?: boolean; children?: ReactNode }) {
   const inputContext = useContext(InputContext);

   return (
      <div
         className={clsx(
            className,
            !headless && "bg-surface-alt flex w-full items-center rounded-md",
            inputContext.message.status === "none" && "focus-within:ring-primary-700 focus-within:ring-1",
            !["none", "default"].includes(inputContext.message.status) && ["ring", statusRingColors[inputContext.message.status]],
         )}
      >
         {children}
      </div>
   );
}

function Label({ children, className }: { children?: ReactNode; className?: string }) {
   const inputContext = useContext(InputContext);
   return (
      <HuginnLabel htmlFor={inputContext.id} className={className}>
         {children}
         {inputContext.required ? <span className="text-negative-300 pl-0.5">*</span> : null}
      </HuginnLabel>
   );
}

HuginnInput.Label = Label;
HuginnInput.Wrapper = Wrapper;
HuginnInput.Input = Input;
HuginnInput.InputContext = InputContext;
HuginnInput.STATUS_RING_COLORS = statusRingColors;
