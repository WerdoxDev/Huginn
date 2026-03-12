import { type HuginnErrorData, type HuginnErrorGroupWrapper } from "@huginn/shared";
import { APIMessages } from "@lib/error-messages";
import { requiredFieldError } from "@lib/utils";
import { useEffect, useState, type FocusEvent } from "react";
import {
   useForm,
   type ChangeHandler,
   type DefaultValues,
   type FieldPath,
   type FieldValues,
   type RegisterOptions,
   type UseFormHandleSubmit,
   type UseFormRegisterReturn,
} from "react-hook-form";

import type { HuginnInputProps, InputMessage } from "@/types";

export function useHuginnForm<I extends FieldValues>(options?: { defaultValues?: DefaultValues<I> }) {
   const {
      reset: hookReset,
      setValue,
      setError,
      getValues,
      handleSubmit: hookHandleSubmit,
      register: hookRegister,
      watch,
      getFieldState,
      formState,
      control,
      setFocus,
   } = useForm<I>({
      reValidateMode: "onChange",
      mode: "onChange",
      defaultValues: options?.defaultValues,
   });

   const values = watch();

   const [inputMessages, setInputMessages] = useState<{ [k: string]: InputMessage }>({});
   const [customMessages, setCustomMessages] = useState<{ [k: string]: InputMessage }>({});
   const [huginnError, setHuginnError] = useState<HuginnErrorData | null>(null);
   const [focusedInput, setFocusedInput] = useState<FieldPath<I> | null>(null);
   const [clearedFields, setClearedFields] = useState<Set<string>>(new Set());

   function handleChange(e: any, name: FieldPath<I>, hookChange: ChangeHandler) {
      hookChange(e);
      setClearedFields((prev) => new Set(prev).add(name));
   }

   function handleBlur(e: FocusEvent, name: FieldPath<I>, hookBlur: ChangeHandler) {
      hookBlur(e);
      setFocusedInput(null);
   }

   function handleFocus(e: FocusEvent, name: FieldPath<I>) {
      setFocusedInput(name);
   }

   const register = <TFieldName extends FieldPath<I> = FieldPath<I>>(
      name: TFieldName,
      options?: RegisterOptions<I, TFieldName>,
   ): Omit<UseFormRegisterReturn<TFieldName>, "onBlur" | "onChange"> & HuginnInputProps => {
      const hookRegisterValue = hookRegister(name, options);
      return {
         ...hookRegisterValue,
         message: inputMessages[name] ?? { status: "none", text: "" },
         required: options?.required as boolean,
         onFocus: (e) => handleFocus(e, name),
         onBlur: (e) => handleBlur(e, name, hookRegisterValue.onBlur),
         onChange: (e) => handleChange(e, name, hookRegisterValue.onChange),
      };
   };

   function reset() {
      hookReset();
      setInputMessages({});
      setCustomMessages({});
      setHuginnError(null);
      setClearedFields(new Set());
   }

   const handleSubmit: UseFormHandleSubmit<I> = (onValid, onInvalid) => {
      return hookHandleSubmit(onValid, onInvalid);
   };

   function handleErrors(error: HuginnErrorData) {
      setCustomMessages({});
      setHuginnError(error);
      setClearedFields(new Set()); // Reset cleared fields on new server error
   }

   function setCustomMessage(name: FieldPath<I>, message: InputMessage | null) {
      setCustomMessages((old) => {
         const newMessages = { ...old };
         if (message) newMessages[name] = message;
         else delete newMessages[name];
         return newMessages;
      });
   }

   useEffect(() => {
      if (formState.isSubmitting) {
         setCustomMessages({});
         setHuginnError(null);
         setClearedFields(new Set()); // Reset on new submission
      }
   }, [formState]);

   useEffect(() => {
      const { errors, isValid } = formState;

      if (huginnError && (isValid || Object.keys(errors).length === 0)) {
         setInputMessages(() => {
            const newMessages: { [k: string]: InputMessage } = {};
            // All fields should get the same error
            if (!huginnError.errors) {
               const values = getValues();
               for (const name of Object.keys(values)) {
                  if (!clearedFields.has(name)) {
                     newMessages[name] = {
                        status: "error",
                        text: APIMessages[huginnError.code] ?? huginnError.message,
                     };
                  }
               }
               return newMessages;
            }
            for (const name of Object.keys(huginnError.errors)) {
               if (huginnError.errors[name] && !clearedFields.has(name)) {
                  newMessages[name] = {
                     status: "error",
                     text: (huginnError.errors[name] as HuginnErrorGroupWrapper)._errors[0].message,
                  };
               } else {
                  newMessages[name] = { status: "none", text: "" };
               }
            }

            return newMessages;
         });

         return;
      }

      setInputMessages(() => {
         const newMessages: { [k: string]: InputMessage } = { ...customMessages };
         for (const name of Object.keys(errors)) {
            const error = errors[name]!;

            if (error.type === "validate") {
               newMessages[name] = { text: (error.message as string) ?? "", status: "error" };
            } else if (error.type === "required") {
               newMessages[name] = requiredFieldError;
            }
         }

         return newMessages;
      });
   }, [formState, huginnError, customMessages, clearedFields]);

   return {
      register,
      setValue,
      getValues,
      handleSubmit,
      handleErrors,
      reset,
      values,
      setError,
      formState,
      focusedInput,
      setCustomMessage,
      getFieldState,
      control,
      setFocus,
   };
}
