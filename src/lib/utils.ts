import { HuginnAPIError } from "@api/index";
import type { HuginnError, HuginnErrorData } from "@shared/errors";
import React, { JSXElementConstructor, ReactNode } from "react";
import { APIMessages } from "./errorMessages";
import { InputStatus, InputValue, InputStatuses, InputValues } from "../types";

export const requiredFieldError: InputStatus = { code: "error", text: "Required" };

export function getInputCurrentStatus(field: InputValue, fieldName: string, errorStatuses: InputStatuses): InputStatus {
   const newStatus: InputStatus =
      !field.value && field.required ? requiredFieldError : errorStatuses[fieldName] || { code: "none", text: "" };

   return newStatus;
}

export function getInputsValidatedStatuses(fields: InputValues, statuses: InputStatuses) {
   const newStatues = { ...statuses };

   Object.keys(fields).forEach((x) => {
      if (!fields[x].value && fields[x].required) {
         newStatues[x] = requiredFieldError;
      }
   });

   return newStatues;
}

export function getInputsStatusesFromError(statuses: InputStatuses, error: HuginnErrorData, field?: string) {
   const newStatuses = { ...statuses };

   Object.keys(newStatuses).forEach((x) => {
      if (!error.errors) {
         const apiMessage = Object.entries(APIMessages).find(([code]) => code === error.code.toString())?.[1];
         newStatuses[x] = { code: "error", text: apiMessage ?? error.message };
      } else if (((field && x === field) ?? !field) && error.errors?.[x]) {
         newStatuses[x] = {
            code: "error",
            text: error.errors[x]._errors[0].message,
         };
      } else {
         newStatuses[x] = { code: "none", text: "" };
      }
   });

   return newStatuses;
}

export function getEmptyStatuses(states: InputStatuses) {
   const newStatuses = { ...states };

   Object.keys(newStatuses).forEach((x) => {
      newStatuses[x] = { code: "none", text: "" };
   });

   return newStatuses;
}

export function checkStatusesHaveErrors(statuses: InputStatuses, exclude?: InputStatuses) {
   const excludeValues = Object.values(exclude ?? {});
   return Object.values(statuses).filter((x) => x.code === "error" && !excludeValues.includes(x)).length !== 0;
}

export function filterChildrenOfType(children: ReactNode, type: JSXElementConstructor<never>) {
   return React.Children.toArray(children).filter(
      (child) => React.isValidElement(child) && typeof child.type === "function" && child.type.name === type.name,
   );
}

export function isWorthyHuginnError(error: Error): error is HuginnAPIError {
   if (error instanceof HuginnAPIError) {
      return true;
   }
   return false;
}

export function createSingleEntryError(error: HuginnAPIError, name: string): HuginnError {
   const apiMessage = Object.entries(APIMessages).find(([code]) => code === error.rawError.code.toString());
   return {
      [name]: { _errors: [{ code: error.rawError.code.toString(), message: apiMessage ? apiMessage[1] : error.rawError.message }] },
   };
}
