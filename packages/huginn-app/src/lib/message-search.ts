import type { APIPostChannelSearchJSONBody, MessageSearchHas, Snowflake } from "@huginnjs/shared";

import { snowflake } from "@huginnjs/shared";

type FilterValue = { value: string; label: string };
export type SearchFilter =
   | (FilterValue & {
        type: "from" | "mentions" | "before" | "after" | "on" | "pinned";
        // | "attachmentFilename"
        // | "attachmentExtension"
        // | "embedType"
        // | "repliedToUserId"
        // | "repliedToMessageId";
     })
   | { type: "has"; value: MessageSearchHas; label: string };
export type SearchFilterEditorType = Exclude<SearchFilter["type"], "before" | "after" | "on"> | "date";

export const searchFilterOptions: { value: SearchFilterEditorType; text: string }[] = [
   { value: "from", text: "From user" },
   { value: "has", text: "Has" },
   { value: "date", text: "Date" },
   { value: "mentions", text: "Mentions" },
   { value: "pinned", text: "Pinned" },
   // { value: "attachmentFilename", text: "Attachment filename" },
   // { value: "attachmentExtension", text: "Attachment extension" },
   // { value: "embedType", text: "Embed type" },
   // { value: "repliedToUserId", text: "Reply to user" },
   // { value: "repliedToMessageId", text: "Reply to message" },
];

export function addSearchFilter(filters: SearchFilter[], next: SearchFilter): SearchFilter[] {
   const remaining = filters.filter((filter) => {
      if (filter.type === next.type) return (next.type === "mentions" || next.type === "has") && filter.value !== next.value;
      if (next.type === "on") return filter.type !== "before" && filter.type !== "after";
      if (next.type === "before" || next.type === "after") return filter.type !== "on";
      return true;
   });
   return [...remaining, next];
}

export function isSearchSnowflake(value: string): boolean {
   return /^[0-9]{1,19}$/.test(value) && BigInt(value) <= (1n << 63n) - 1n;
}

function getDayBounds(value: string) {
   const start = new Date(`${value}T00:00:00`);
   if (!/^\d{4}-\d{2}-\d{2}$/.test(value) || !Number.isFinite(start.getTime())) throw new Error("Choose a valid date.");
   const [year, month, day] = value.split("-").map(Number);
   if (start.getFullYear() !== year || start.getMonth() !== month - 1 || start.getDate() !== day) throw new Error("Choose a valid date.");
   const next = new Date(start);
   next.setDate(next.getDate() + 1);
   return { start: start.getTime(), end: next.getTime() - 1 };
}

export function buildMessageSearchBody(
   channelId: Snowflake,
   content: string,
   filters: SearchFilter[],
   sortOrder: "asc" | "desc",
   limit: number = 25,
): APIPostChannelSearchJSONBody {
   const body: APIPostChannelSearchJSONBody = { channelId, sortOrder, limit, ...(content.trim() && { content: content.trim() }) };
   const epoch = snowflake.getTimestamp("0");

   for (const filter of filters) {
      switch (filter.type) {
         case "from":
            body.authorId = filter.value;
            break;
         case "mentions":
            body.mentions = [...new Set([...(body.mentions ?? []), filter.value])];
            break;
         case "has":
            body.has = [...new Set([...(body.has ?? []), filter.value])];
            break;
         case "pinned":
            body.pinned = filter.value === "true";
            break;
         // case "attachmentFilename":
         // case "attachmentExtension":
         // case "embedType":
         // case "repliedToUserId":
         // case "repliedToMessageId":
         //    body[filter.type] = filter.value;
         //    break;
         case "before":
         case "after":
         case "on": {
            const { start, end } = getDayBounds(filter.value);
            if (end < epoch) throw new Error("Choose a date on or after January 1, 2023.");
            try {
               if (filter.type === "before") body.minId = start <= epoch ? "0" : snowflake.getMinimum(start);
               if (filter.type === "after") body.maxId = snowflake.getMaximum(end);
               if (filter.type === "on") {
                  body.minId = snowflake.getMinimum(end + 1);
                  if (start > epoch) body.maxId = snowflake.getMaximum(start - 1);
               }
            } catch {
               throw new Error("Choose a date within the supported message date range.");
            }
            break;
         }
      }
   }

   if (body.minId !== undefined && body.maxId !== undefined && BigInt(body.maxId) + 1n >= BigInt(body.minId)) {
      throw new Error("The before date must be later than the after date.");
   }
   return body;
}
