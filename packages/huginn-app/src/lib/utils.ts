import type { QueryClient } from "@tanstack/react-query";
import type { JSXElementConstructor, ReactNode } from "react";

import {
   type APIMessage,
   type APIPostMessageReferenceJSONBody,
   type APIRelationshipWithoutOwner,
   type APIUserProfile,
   ChannelType,
   type DirectChannel,
   HuginnAPIError,
   type HuginnError,
   MessageType,
   type PresenceStatus,
   type PresenceUser,
   type Snowflake,
   type UserPresence,
   WorkerID,
   changeUrlBase,
   omit,
   snowflake,
} from "@huginn/shared";
import { clientStore } from "@stores/clientStore";
import { Children, isValidElement } from "react";

import type { AppDirectChannel, AppMessage, AppPresence, AppRelationship, AppUser, AppUserProfile, InputMessage } from "@/types";

import { APIMessages } from "./error-messages";
import { getMessage } from "./query-utils";

export const requiredFieldError: InputMessage = { status: "error", text: "Required" } as const;

export function filterChildrenOfType(children: ReactNode, type: JSXElementConstructor<never>) {
   return Children.toArray(children).filter((child) => isValidElement(child) && typeof child.type === "function" && child.type.name === type.name);
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
      [name]: {
         _errors: [
            {
               code: error.rawError.code.toString(),
               message: apiMessage ? apiMessage[1] : error.rawError.message,
            },
         ],
      },
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
   console.log(channel);
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
         ? {
              referencedMessage: message.referencedMessage ? convertToAppMessage(message.referencedMessage, source) : message.referencedMessage,
           }
         : {}),
      authorId: message.author.id,
      mentions: message.mentions.map((x) => x.id),
      isPreview: false,
      source,
   };
}

export function convertToAppUser<U extends PresenceUser = PresenceUser>(user: U): AppUser<U> {
   return {
      ...user,
      displayName: user?.displayName ?? user?.username ?? null,
      originalDisplayName: user.displayName,
   };
}

export function convertToAppUserProfile(profile: APIUserProfile): AppUserProfile {
   return {
      ...omit(profile, ["user"]),
      userId: profile.user.id,
   };
}

export function convertToAppPresence(presence: UserPresence): AppPresence {
   const cdn = `${clientStore.getState().hostnames.cdn}/cdn`;
   const activities = presence.activities.map((x) => ({
      ...x,
      iconUrl: x.iconUrl ? changeUrlBase(x.iconUrl, cdn) : undefined,
   }));
   return { ...omit(presence, ["user"]), userId: presence.user.id, activities };
}

export const PRESENCE_STATUS_MAP: Record<PresenceStatus, { text: string; color: string }> = {
   offline: { text: "Offline", color: "bg-white/50" },
   dnd: { text: "Do Not Disturb", color: "bg-negative-100" },
   idle: { text: "Idle", color: "bg-caution-100" },
   online: { text: "Online", color: "bg-positive-100" },
} as const;

export function getMediaErrorMessage(e: unknown, type: "camera" | "screen") {
   const defaultError = "An unexpected error occurred. Please try again.";
   if (!(e instanceof DOMException)) {
      return defaultError;
   }

   switch (e.name) {
      case "NotAllowedError":
         return type === "camera"
            ? "Huginn doesn't have access to your camera. Please allow it and try again."
            : "Huginn doesn't have access to your screen. Please allow it and try again.";
      case "NotFoundError":
         return type === "camera" ? "No camera was found" : "No screens or windows were found";
      case "AbortError":
         return type === "camera" ? "Camera access was canceled before it started." : "Screen sharing was canceled before it started.";
      case "NotReadableError":
         return type === "camera"
            ? "Your system prevented access to your camera. Try restarting your browser."
            : "Your system prevented screen sharing. Try restarting your browser.";
      case "SecurityError":
         return "Your browser blocked this action for security reasons. Try restarting your browser.";

      default:
         return defaultError;
   }
}

export function createPreviewMessage(
   queryClient: QueryClient,
   data: {
      content: string;
      channelId: Snowflake;
      authorId: Snowflake;
      nonce: Snowflake;
      messageReference?: APIPostMessageReferenceJSONBody;
   },
) {
   const referencedMessage = getMessage(data.channelId, data.messageReference?.messageId, queryClient);

   const previewMessage: AppMessage = {
      isPreview: true,
      id: snowflake.generateString(WorkerID.APP),
      timestamp: new Date().toISOString(),
      content: data.content,
      channelId: data.channelId,
      authorId: data.authorId,
      nonce: data.nonce,
      referencedMessage: referencedMessage,
      abortController: new AbortController(),
   };

   return previewMessage;
}
