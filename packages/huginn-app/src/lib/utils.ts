import type { AppDirectChannel, AppMessage, AppRelationship, InputStatus, InputStatuses, InputValue, InputValues } from "@/types";
import {
	type APIDefaultMessage,
	type APIRelationshipWithoutOwner,
	type DirectChannel,
	HuginnAPIError,
	type HuginnError,
	type HuginnErrorData,
	type HuginnErrorGroupWrapper,
	type Snowflake,
	omit,
} from "@huginn/shared";
import type { InfiniteData, QueryClient } from "@tanstack/react-query";
import type { JSXElementConstructor, ReactNode } from "react";
import { Children, isValidElement } from "react";
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
				text: (error.errors[key] as HuginnErrorGroupWrapper)._errors[0].message,
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

export function doStatusesHaveErrors(statuses: InputStatuses, exclude?: InputStatuses) {
	const excludeValues = Object.values(exclude ?? {});
	return Object.values(statuses).filter((x) => x.code === "error" && !excludeValues.includes(x)).length !== 0;
}

export function filterChildrenOfType(children: ReactNode, type: JSXElementConstructor<never>) {
	return Children.toArray(children).filter((child) => isValidElement(child) && typeof child.type === "function" && child.type.name === type.name);
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

export function getFirstChildClosestToTop<E extends HTMLElement>(container: E) {
	const containerRect = container.getBoundingClientRect();
	const containerTop = containerRect.top;

	let closestChild = null;
	let smallestDistance = Number.POSITIVE_INFINITY;

	for (const child of container.children) {
		const childRect = child.getBoundingClientRect();
		const distanceFromTop = Math.abs(childRect.top - containerTop);

		if (distanceFromTop < smallestDistance) {
			smallestDistance = distanceFromTop;
			closestChild = child;
		}
	}

	return closestChild;
}

export function getSizeText(size: number) {
	const type = size >= 1000000 ? "mb" : "kb";
	return `${(size / (type === "kb" ? 1000 : 1000000)).toFixed(2)} ${type === "kb" ? "KB" : "MB"}`;
}

export function getCurrentPageMessages(channelId: Snowflake, queryClient: QueryClient) {
	const messages = queryClient.getQueryData<InfiniteData<AppMessage[], { before: string; after: string }>>(["messages", channelId]);
	return messages?.pages.flat();
}

export function convertToAppDirectChannel(channel: DirectChannel): AppDirectChannel {
	return { ...omit(channel, ["recipients"]), recipientIds: channel.recipients.map((x) => x.id) };
}

export function convertToAppRelationship(relationship: APIRelationshipWithoutOwner): AppRelationship {
	return { ...omit(relationship, ["user"]), userId: relationship.user.id };
}

export function convertToAppMessage(message: APIDefaultMessage): AppMessage {
	return { ...omit(message, ["author"]), authorId: message.author.id, preview: false };
}
