import type { HuginnError } from "@shared/errors";
import React, { JSXElementConstructor, ReactNode } from "react";

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

export function getInputsStatusesFromError(statuses: InputStatuses, errors: HuginnError, field?: string) {
   const newStatuses = { ...statuses };

   Object.keys(newStatuses).forEach((x) => {
      if (((field && x === field) ?? !field) && errors[x]) {
         newStatuses[x] = {
            code: "error",
            text: errors[x]._errors[0].message,
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
