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
   MessageFlags,
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
import { Element, Text, type Descendant } from "slate";

import type { AppAttachment, AppDirectChannel, AppMessage, AppPresence, AppRelationship, AppUser, AppUserProfile, InputMessage } from "@/types";

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

   let closestChild: globalThis.Element | null = null;
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
           ? channel.name === null
              ? channel.recipients.map((x) => x.displayName ?? x.username).join(", ")
              : channel.name
           : "unknown";

   const { recipients: _, ...rest } = channel;
   return {
      ...rest,
      recipientIds: channel.recipients.map((x) => x.id),
      name,
      originalName: channel.type === ChannelType.GROUP_DM ? channel.name : undefined,
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
   invisible: { text: "Invisible", color: "bg-white/50" },
   offline: { text: "Offline", color: "bg-white/50" },
   dnd: { text: "Do Not Disturb", color: "bg-negative-300" },
   idle: { text: "Idle", color: "bg-caution-300" },
   online: { text: "Online", color: "bg-positive-300" },
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
      flags?: MessageFlags;
      attachments?: AppAttachment[];
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
      flags: data.flags,
      attachments: data.attachments,
      referencedMessage: referencedMessage,
      abortController: new AbortController(),
   };

   return previewMessage;
}

export function getDataURLFromSrc(src: string, circle: boolean = true): Promise<string> {
   return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.onload = () => {
         const canvas = document.createElement("canvas");
         canvas.width = img.width;
         canvas.height = img.height;
         const ctx = canvas.getContext("2d");

         if (circle && ctx) {
            const radius = Math.min(canvas.width, canvas.height) / 2;
            ctx.beginPath();
            ctx.arc(canvas.width / 2, canvas.height / 2, radius, 0, Math.PI * 2);
            ctx.closePath();
            ctx.clip();
         }

         if (ctx) ctx.drawImage(img, 0, 0);

         resolve(canvas.toDataURL("image/png", 1.0));
      };
      img.onerror = reject;
      img.src = src;
   });
}

export function getSolidColorDataURL(color: string, size: number, circle = true) {
   const canvas = document.createElement("canvas");
   canvas.width = size;
   canvas.height = size;
   const ctx = canvas.getContext("2d");

   if (circle && ctx) {
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, Math.min(size, size) / 2, 0, Math.PI * 2);
      ctx.clip(); // clip all future drawing to the circle
   }

   if (ctx) {
      ctx.fillStyle = color;
      ctx.fillRect(0, 0, size, size);
   }

   return canvas.toDataURL("image/png");
}

export function serializeSlate(nodes: Descendant[], options?: { emojiAsSlug?: boolean }) {
   let text = "";
   for (const node of nodes) {
      if (Text.isText(node)) {
         text += node.text;
         continue;
      }

      const children = serializeSlate(node.children, options);

      if (Element.isElement(node) && node.type === "emoji") {
         if (options?.emojiAsSlug) text += node.slug;
         else text += node.unicode || node.slug;
         continue;
      }

      if (Element.isElement(node) && node.type === "mention") {
         if (node.mentionType === "everyone" || node.mentionType === "owner") text += "@" + node.usedText;
         else if (node.mentionType === "user") text += "<@" + node.userId + ">";
         continue;
      }

      if (Element.isElement(node) && node.type === "paragraph") {
         text += children + "\n";
         continue;
      }
   }

   return text;
}
