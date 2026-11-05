import { t } from "elysia";

export const matcherValuesSchema = t.Array(t.String({ minLength: 1, maxLength: 1_024 }), { maxItems: 50 });

export function normalizeMatcherValues(values: string[]) {
   return [...new Set(values.map((value) => value.trim()).filter(Boolean))];
}

export function normalizeExeNames(values: string[]) {
   return normalizeMatcherValues(values.map((value) => value.replaceAll("\\", "/")));
}

export function isValidExeName(value: string) {
   const parts = value.split("/");
   return parts.length <= 2 && parts.every((part) => part.length > 0 && part !== "." && part !== "..");
}
