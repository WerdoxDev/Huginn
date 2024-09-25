import type { InputStatus, InputStatuses, InputValue, InputValues } from "@/types";
import { HuginnAPIError } from "@huginn/api";
import type { HuginnError, HuginnErrorData } from "@huginn/shared";
import React, { type JSXElementConstructor, type ReactNode } from "react";
import { APIMessages } from "./error-messages";

export const requiredFieldError: InputStatus = { code: "error", text: "Required" };

export function getInputCurrentStatus(field: InputValue, fieldName: string, errorStatuses: InputStatuses): InputStatus {
	const newStatus: InputStatus = !field.value && field.required ? requiredFieldError : errorStatuses[fieldName] || { code: "none", text: "" };

	return newStatus;
}

export function getInputsValidatedStatuses(fields: InputValues, statuses: InputStatuses) {
	const newStatues = { ...statuses };

	for (const key of Object.keys(fields)) {
		if (!fields[key].value && fields[key].required) {
			newStatues[key] = requiredFieldError;
		}
	}

	return newStatues;
}

export function getInputsStatusesFromError(statuses: InputStatuses, error: HuginnErrorData, field?: string) {
	const newStatuses = { ...statuses };

	for (const key of Object.keys(newStatuses)) {
		if (!error.errors) {
			const apiMessage = Object.entries(APIMessages).find(([code]) => code === error.code.toString())?.[1];
			newStatuses[key] = { code: "error", text: apiMessage ?? error.message };
		} else if (((field && key === field) ?? !field) && error.errors[key]) {
			newStatuses[key] = {
				code: "error",
				text: error.errors[key]._errors[0].message,
			};
		} else {
			newStatuses[key] = { code: "none", text: "" };
		}
	}

	return newStatuses;
}

export function getEmptyStatuses(states: InputStatuses) {
	const newStatuses = { ...states };

	for (const key of Object.keys(newStatuses)) {
		newStatuses[key] = { code: "none", text: "" };
	}

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
