import HuginnLabel from "@components/HuginnLabel";
import StatusMessage from "@components/StatusMessage";
import { snowflake, WorkerID } from "@huginn/shared";
import clsx from "clsx";
import {
   type ChangeEvent,
   createContext,
   type FocusEvent,
   type HTMLInputTypeAttribute,
   type ReactNode,
   type RefCallback,
   type RefObject,
   useContext,
   useRef,
   useState,
} from "react";

import type { HuginnInputProps, InputMessage, StatusType } from "@/types";

const InputContext = createContext<{
   id: string;
   message: InputMessage;
   value?: string;
   required?: boolean;
   placeholder?: string;
   type?: HTMLInputTypeAttribute;
   ref?: RefCallback<HTMLInputElement | null> | RefObject<HTMLInputElement | null>;
   disabled?: boolean;
   name?: string;
   autoFocus?: boolean;
   onChange?: (e: ChangeEvent<HTMLInputElement>) => void;
   onBlur?: (e: FocusEvent) => void;
   onFocus?: (e: FocusEvent) => void;
}>({
   id: "",
   message: { status: "none", text: "" },
});

export default function HuginnInput(props: HuginnInputProps) {
   const [id, _setId] = useState(() => snowflake.generateString(WorkerID.APP));
   const inputRef = useRef<HTMLInputElement>(null);

   return (
      <InputContext.Provider
         value={{
            id: id,
            value: props.value,
            required: props.required,
            message: props.message,
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
            {!props.hideMessage && (
               <StatusMessage status={props.message.status} text={props.message.text} visible={props.message.status !== "none"} />
            )}
         </div>
      </InputContext.Provider>
   );
}

function Input(props: { headless?: boolean; className?: string; lowercase?: boolean }) {
   const inputContext = useContext(InputContext);
   // const [cursor, setCursor] = useState<number | null>(null);

   const { className, headless, lowercase, ...rest } = props;

   function onChange(e: ChangeEvent<HTMLInputElement>) {
      if (lowercase) {
         e.target.value = e.target.value.toLowerCase();
      }
      inputContext.onChange?.(e);
   }
   // useLayoutEffect(() => {
   //    // if("current")
   //    inputContext.ref?.current?.setSelectionRange(cursor, cursor);
   // }, [inputContext.value, cursor]);

   return (
      <input
         spellCheck={false}
         id={inputContext.id}
         value={inputContext.value}
         ref={inputContext.ref}
         className={clsx(
            !headless && "placeholder-text/60 w-full bg-transparent p-2 text-white outline-hidden disabled:cursor-not-allowed",
            className,
         )}
         disabled={inputContext.disabled}
         type={inputContext.type ?? "text"}
         autoFocus={inputContext.autoFocus}
         autoComplete="new-password"
         placeholder={inputContext.placeholder}
         onChange={onChange}
         onFocus={inputContext.onFocus}
         onBlur={inputContext.onBlur}
         name={inputContext.name}
         {...rest}
      />
   );
}

const STATUS_RING_COLORS: Record<StatusType, string> = {
   none: "",
   default: "ring-primary-700",
   error: "ring-negative-300",
   success: "ring-positive-300",
};

function Wrapper(props: { className?: string; headless?: boolean; children?: ReactNode }) {
   const inputContext = useContext(InputContext);

   return (
      <div
         className={clsx(
            props.className,
            !props.headless && "bg-surface-alt flex w-full items-center rounded-md",
            !["none", "default"].includes(inputContext.message.status) && ["ring", STATUS_RING_COLORS[inputContext.message.status]],
         )}
      >
         {props.children}
      </div>
   );
}

function Label(props: { children?: ReactNode; className?: string }) {
   const inputContext = useContext(InputContext);
   return (
      <HuginnLabel htmlFor={inputContext.id} className={props.className}>
         {props.children}
         {inputContext.required && <span className="text-negative-300 pl-0.5">*</span>}
      </HuginnLabel>
   );
}

HuginnInput.Label = Label;
HuginnInput.Wrapper = Wrapper;
HuginnInput.Input = Input;
HuginnInput.InputContext = InputContext;
HuginnInput.STATUS_RING_COLORS = STATUS_RING_COLORS;
