import clsx from "clsx";
import { createContext, type ChangeEvent, type ComponentPropsWithRef, type FocusEvent, type ReactNode, type Ref, useContext, useId, useRef } from "react";

import type { HuginnInputMessage, HuginnStatus } from "../../types";

import HuginnLabel from "../HuginnLabel";
import StatusMessage from "../StatusMessage";

export type HuginnTextAreaProps = {
   children?: ReactNode;
   headless?: boolean;
   className?: string;
   message?: HuginnInputMessage;
   hideMessage?: boolean;
   required?: boolean;
   disabled?: boolean;
   value?: string;
   placeholder?: string;
   ref?: Ref<HTMLTextAreaElement>;
   name?: string;
   autoFocus?: boolean;
   onChange?: (event: ChangeEvent<HTMLTextAreaElement>) => void;
   onBlur?: (event: FocusEvent<HTMLTextAreaElement>) => void;
   onFocus?: (event: FocusEvent<HTMLTextAreaElement>) => void;
};

type TextAreaContextValue = Omit<HuginnTextAreaProps, "children" | "headless" | "className" | "hideMessage" | "message"> & {
   id: string;
   message: HuginnInputMessage;
};

const emptyMessage: HuginnInputMessage = { status: "none", text: "" };
const TextAreaContext = createContext<TextAreaContextValue>({ id: "", message: emptyMessage });

export default function HuginnTextArea(props: HuginnTextAreaProps) {
   const generatedId = useId();
   const textAreaRef = useRef<HTMLTextAreaElement>(null);
   const message = props.message ?? emptyMessage;

   return (
      <TextAreaContext.Provider
         value={{
            id: generatedId,
            value: props.value,
            required: props.required,
            message,
            placeholder: props.placeholder,
            ref: props.ref ?? textAreaRef,
            disabled: props.disabled,
            name: props.name,
            autoFocus: props.autoFocus,
            onChange: props.onChange,
            onBlur: props.onBlur,
            onFocus: props.onFocus,
         }}
      >
         <div className={clsx(!props.headless && "flex flex-col", props.className)}>
            {props.children}
            {!props.hideMessage ? <StatusMessage status={message.status} text={message.text} visible={message.status !== "none"} /> : null}
         </div>
      </TextAreaContext.Provider>
   );
}

type TextAreaProps = Omit<ComponentPropsWithRef<"textarea">, "id" | "value" | "disabled" | "name" | "onChange" | "onBlur" | "onFocus"> & {
   headless?: boolean;
};

function TextArea({ className, headless, ...props }: TextAreaProps) {
   const context = useContext(TextAreaContext);

   return (
      <textarea
         {...props}
         spellCheck={props.spellCheck ?? false}
         id={context.id}
         value={context.value}
         ref={context.ref}
         className={clsx(
            !headless && "placeholder:text-text/60 min-h-24 w-full resize-y bg-transparent p-2 text-white outline-hidden disabled:cursor-not-allowed",
            className,
         )}
         disabled={context.disabled}
         autoFocus={context.autoFocus}
         placeholder={context.placeholder}
         onChange={context.onChange}
         onFocus={context.onFocus}
         onBlur={context.onBlur}
         name={context.name}
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
   const context = useContext(TextAreaContext);

   return (
      <div
         className={clsx(
            className,
            !headless && "bg-surface-alt focus-within:ring-primary-700 flex w-full rounded-md focus-within:ring-1",
            !["none", "default"].includes(context.message.status) && ["ring", statusRingColors[context.message.status]],
         )}
      >
         {children}
      </div>
   );
}

function Label({ children, className }: { children?: ReactNode; className?: string }) {
   const context = useContext(TextAreaContext);
   return (
      <HuginnLabel htmlFor={context.id} className={className}>
         {children}
         {context.required ? <span className="text-negative-300 pl-0.5">*</span> : null}
      </HuginnLabel>
   );
}

HuginnTextArea.Label = Label;
HuginnTextArea.Wrapper = Wrapper;
HuginnTextArea.TextArea = TextArea;
HuginnTextArea.STATUS_RING_COLORS = statusRingColors;
