import type {
   AppDirectChannel,
   AppMessage,
   AppPresence,
   AppRelationship,
   AppUser,
   InputStatus,
   InputStatuses,
   InputValue,
   InputValues,
} from "@/types";
import {
   type APIMessage,
   type APIRelationshipWithoutOwner,
   ChannelType,
   type DirectChannel,
   HuginnAPIError,
   type HuginnError,
   type HuginnErrorData,
   type HuginnErrorGroupWrapper,
   MessageType,
   type PresenceStatus,
   type PresenceUser,
   type UserPresence,
   changeUrlBase,
   omit,
} from "@huginn/shared";
import type { JSXElementConstructor, ReactNode } from "react";
import { Children, isValidElement } from "react";
import { APIMessages } from "./error-messages";
import { clientStore } from "@stores/clientStore";

export const requiredFieldError: InputStatus = { code: "error", text: "Required" };

export function getInputCurrentStatus(field: InputValue, fieldName: string, errorStatuses: InputStatuses): InputStatus {
   const newStatus: InputStatus =
      !field.value && field.required ? requiredFieldError : errorStatuses[fieldName] || { code: "none", text: "" };

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
   return Children.toArray(children).filter(
      (child) => isValidElement(child) && typeof child.type === "function" && child.type.name === type.name,
   );
}

export function isWorthyHuginnError(error: unknown): error is HuginnAPIError {
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

export function getFirstChildClosestToBottom<E extends HTMLElement>(container: E) {
   const containerRect = container.getBoundingClientRect();
   const containerBottom = containerRect.bottom;

   let closestChild: Element | null = null;
   let smallestDistance = Number.POSITIVE_INFINITY;

   for (const child of container.children) {
      const childRect = child.getBoundingClientRect();
      const distanceFromBottom = Math.abs(childRect.bottom - containerBottom);

      if (distanceFromBottom < smallestDistance) {
         smallestDistance = distanceFromBottom;
         closestChild = child;
      }
   }

   return closestChild;
}

export function getSizeText(size: number) {
   const type = size >= 1000000 ? "mb" : "kb";
   return `${(size / (type === "kb" ? 1000 : 1000000)).toFixed(2)} ${type === "kb" ? "KB" : "MB"}`;
}

export function convertToAppDirectChannel(channel: DirectChannel): AppDirectChannel {
   const name =
      channel.type === ChannelType.DM
         ? (channel.recipients[0].displayName ?? channel.recipients[0].username)
         : channel.type === ChannelType.GROUP_DM
           ? !channel.name
              ? channel.recipients.map((x) => x.displayName ?? x.username).join(", ")
              : channel.name
           : "";

   return {
      ...omit(channel, ["recipients"]),
      recipientIds: channel.recipients.map((x) => x.id),
      name,
      originalName: channel.name,
   };
}

export function convertToAppRelationship(relationship: APIRelationshipWithoutOwner): AppRelationship {
   return { ...omit(relationship, ["user"]), userId: relationship.user.id };
}

export function convertToAppMessage(message: APIMessage, source: "websocket" | "fetch"): AppMessage {
   const { author: _, mentions: __, ...rest } = message;
   return {
      ...(message.type === MessageType.REPLY ? omit(message, ["referencedMessage", "author", "mentions"]) : rest),
      ...(message.type === MessageType.REPLY
         ? { referencedMessage: message.referencedMessage ? convertToAppMessage(message.referencedMessage, source) : undefined }
         : {}),
      authorId: message.author.id,
      mentions: message.mentions.map((x) => x.id),
      isPreview: false,
      source,
   };
}

export function convertToAppUser(user: PresenceUser): AppUser {
   return { ...user, displayName: user?.displayName ?? user?.username, originalDisplayName: user.displayName };
}

export function convertToAppPresence(presence: UserPresence): AppPresence {
   const cdn = `${clientStore.getState().hostnames.cdn}/cdn`;
   const activities = presence.activities.map((x) => ({ ...x, iconUrl: x.iconUrl ? changeUrlBase(x.iconUrl, cdn) : undefined }));
   return { ...omit(presence, ["user"]), userId: presence.user.id, activities };
}

export const presenceStatuses: Record<PresenceStatus, { text: string; color: string }> = {
   offline: { text: "Offline", color: "bg-white/50" },
   dnd: { text: "Do Not Disturb", color: "bg-negative-100" },
   idle: { text: "Idle", color: "bg-caution-100" },
   online: { text: "Online", color: "bg-positive-100" },
} as const;
