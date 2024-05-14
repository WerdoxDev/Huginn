import { HuginnError } from "@shared/errors";
import { useState } from "react";
import {
   getInputCurrentStatus,
   getInputsValidatedStatuses,
   getEmptyStatuses,
   getInputsStatusesFromError,
   doStatusesHaveErrors,
} from "../utils";

export function useInputs(inputsOptions: InputOptions[]) {
   const newValues: InputValues = {};
   const newStatuses: InputStatuses = {};
   const inputProps: InputProps = {};

   for (const x of inputsOptions) {
      newValues[x.name] = { value: x.default || "", required: x.required };
      newStatuses[x.name] = { code: "none", text: "" };

      inputProps[x.name] = {
         value: newValues[x.name].value,
         status: newStatuses[x.name],
         onChange: (e) => onValueChanged(x.name, e.value),
      };
   }

   const [values, setValues] = useState<InputValues>(newValues);
   const [statuses, setStatuses] = useState<InputStatuses>(newStatuses);
   const [errorStatuses, setErrorStatuses] = useState<InputStatuses>({});

   function onValueChanged(inputName: string, value: string) {
      const updatedValues = { ...values };
      const updatedStatuses = { ...statuses };

      updatedValues[inputName].value = value;
      updatedStatuses[inputName] = getInputCurrentStatus(values[inputName], inputName, errorStatuses);

      setValues(updatedValues);
      setStatuses(updatedStatuses);

      console.log(updatedValues[inputName]);
   }

   function validateValues() {
      setStatuses(getInputsValidatedStatuses(values, statuses));
      if (doStatusesHaveErrors(statuses, errorStatuses)) {
         return false;
      }

      return true;
   }

   function resetStatuses() {
      setStatuses(getEmptyStatuses(statuses));
      setErrorStatuses({});
   }

   function handleErrors(errors: HuginnError) {
      const newStatuses = getInputsStatusesFromError(statuses, errors);

      setStatuses(newStatuses);
      setErrorStatuses({ ...newStatuses });
   }

   return { inputProps, values, statuses, onValueChanged, validateValues, resetStatuses, handleErrors };
}
