import { HuginnErrorData } from "@huginn/shared";
import { useEffect, useState } from "react";
import {
   checkStatusesHaveErrors,
   getEmptyStatuses,
   getInputCurrentStatus,
   getInputsStatusesFromError,
   getInputsValidatedStatuses,
} from "../lib/utils";
import { InputOptions, InputValues, InputStatuses, InputProps, InputStatus } from "../types";

export function useInputs(inputsOptions: InputOptions[]) {
   const newValues: InputValues = {};
   const newStatuses: InputStatuses = {};
   const newInputsProps: InputProps = {};

   for (const x of inputsOptions) {
      newValues[x.name] = { value: x.default ?? "", required: x.required };
      newStatuses[x.name] = { code: "none", text: "" };

      newInputsProps[x.name] = {
         value: newValues[x.name].value,
         status: newStatuses[x.name],
         required: x.required,
         onChange: e => {
            onValueChanged(x.name, e.value);
         },
      };
   }

   const [values, setValues] = useState<InputValues>(newValues);
   const [statuses, setStatuses] = useState<InputStatuses>(newStatuses);
   const [inputsProps, setInputProps] = useState<InputProps>(newInputsProps);
   const [errorStatuses, setErrorStatuses] = useState<InputStatuses>({});

   useEffect(() => {
      const newInputsProps: InputProps = {};

      for (const x of inputsOptions) {
         newInputsProps[x.name] = {
            value: values[x.name].value,
            status: statuses[x.name],
            required: x.required,
            onChange: e => {
               onValueChanged(x.name, e.value);
            },
         };
      }

      setInputProps(newInputsProps);
   }, [values, statuses]);

   function onValueChanged(inputName: string, value: string) {
      const updatedValues = { ...values };
      const updatedStatuses = { ...statuses };

      updatedValues[inputName].value = value;
      updatedStatuses[inputName] = getInputCurrentStatus(values[inputName], inputName, errorStatuses);

      setValues(updatedValues);
      setStatuses(updatedStatuses);
   }

   function validateValues() {
      const validatedStatuses = getInputsValidatedStatuses(values, statuses);
      setStatuses(validatedStatuses);
      if (checkStatusesHaveErrors(validatedStatuses, errorStatuses)) {
         return false;
      }

      return true;
   }

   function resetStatuses() {
      setStatuses(getEmptyStatuses(statuses));
      setErrorStatuses({});
   }

   function handleErrors(errors: HuginnErrorData) {
      const newStatuses = getInputsStatusesFromError(statuses, errors);
      console.log(newStatuses);

      setStatuses(newStatuses);
      setErrorStatuses({ ...newStatuses });
   }

   function setInputStatus(inputName: string, status: InputStatus) {
      const newStatuses = { ...statuses };
      newStatuses[inputName] = status;

      setStatuses(newStatuses);
   }

   return { inputsProps, values, statuses, onValueChanged, validateValues, resetStatuses, handleErrors, setInputStatus };
}
