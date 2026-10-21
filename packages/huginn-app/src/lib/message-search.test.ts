import { snowflake } from "@huginnjs/shared";
import { describe, expect, it } from "vitest";

import { addSearchFilter, buildMessageSearchBody, isSearchSnowflake, type SearchFilter } from "./message-search";

function filter(type: Exclude<SearchFilter["type"], "has">, value: string): SearchFilter {
   return { type, value, label: `${type}: ${value}` };
}

function request(filters: SearchFilter[]) {
   return buildMessageSearchBody("123", "", filters, "desc", 25);
}

describe("message search requests", () => {
   it("maps all filters to the API body and preserves false pinned status", () => {
      const body = buildMessageSearchBody(
         "123",
         " hello ",
         [
            filter("from", "10"),
            filter("mentions", "11"),
            filter("mentions", "12"),
            { type: "has", value: "image", label: "Image" },
            { type: "has", value: "embed", label: "Embed" },
            filter("pinned", "false"),
            filter("attachmentFilename", "photo"),
            filter("attachmentExtension", ".png"),
            filter("embedType", "image"),
            filter("repliedToUserId", "13"),
            filter("repliedToMessageId", "14"),
         ],
         "asc",
         10,
      );
      expect(body).toEqual({
         channelId: "123",
         content: "hello",
         authorId: "10",
         mentions: ["11", "12"],
         has: ["image", "embed"],
         pinned: false,
         attachmentFilename: "photo",
         attachmentExtension: ".png",
         embedType: "image",
         repliedToUserId: "13",
         repliedToMessageId: "14",
         sortOrder: "asc",
         limit: 10,
      });
      expect(request([])).toEqual({ channelId: "123", sortOrder: "desc", limit: 25 });
   });

   it("uses the start of the before day and the end of the after day", () => {
      const body = request([filter("before", "2026-10-21"), filter("after", "2026-10-01")]);
      expect(body.minId).toBe(snowflake.getMinimum(new Date("2026-10-21T00:00:00")));
      expect(body.maxId).toBe(snowflake.getMaximum(new Date("2026-10-01T23:59:59.999")));
   });

   it.each(["2026-03-29", "2026-10-25"])("includes the whole local day across daylight saving changes on %s", (day) => {
      const body = request([filter("on", day)]);
      const start = new Date(`${day}T00:00:00`);
      const next = new Date(start);
      next.setDate(next.getDate() + 1);
      expect(body.maxId).toBe(snowflake.getMaximum(start.getTime() - 1));
      expect(body.minId).toBe(snowflake.getMinimum(next));
      expect(BigInt(body.maxId!)).toBeLessThan(BigInt(snowflake.getMinimum(start)));
      expect(BigInt(body.minId!)).toBeGreaterThan(BigInt(snowflake.getMaximum(next.getTime() - 1)));
   });

   it("handles the first supported local day without generating negative IDs", () => {
      const body = request([filter("on", "2023-01-01")]);
      expect(BigInt(body.minId!)).toBeGreaterThan(0n);
      if (body.maxId !== undefined) expect(BigInt(body.maxId)).toBeGreaterThanOrEqual(0n);
   });

   it("rejects invalid dates, unsupported dates, and empty date ranges", () => {
      for (const day of ["invalid", "2026-02-30", "2022-01-01", "9999-01-01"]) {
         expect(() => request([filter("on", day)])).toThrow();
      }
      expect(() => request([filter("after", "2026-10-21"), filter("before", "2026-10-01")])).toThrow("before date");
      expect(() => request([filter("after", "2026-10-21"), filter("before", "2026-10-22")])).toThrow("before date");
   });
});

describe("search filter lists", () => {
   it("replaces singleton filters and accumulates distinct mentions and content types", () => {
      let filters = addSearchFilter([filter("from", "1")], filter("from", "2"));
      expect(filters).toEqual([filter("from", "2")]);
      filters = addSearchFilter(filters, filter("mentions", "1"));
      filters = addSearchFilter(filters, filter("mentions", "2"));
      filters = addSearchFilter(filters, filter("mentions", "1"));
      filters = addSearchFilter(filters, { type: "has", value: "image", label: "Image" });
      filters = addSearchFilter(filters, { type: "has", value: "video", label: "Video" });
      expect(request(filters)).toMatchObject({ authorId: "2", mentions: ["2", "1"], has: ["image", "video"] });
   });

   it("keeps on-date filters mutually exclusive with before/after filters", () => {
      let filters = addSearchFilter([filter("before", "2026-10-21"), filter("after", "2026-10-01")], filter("on", "2026-10-10"));
      expect(filters).toEqual([filter("on", "2026-10-10")]);
      filters = addSearchFilter(filters, filter("before", "2026-10-20"));
      expect(filters).toEqual([filter("before", "2026-10-20")]);
   });

   it("validates snowflakes before the API receives them", () => {
      expect(isSearchSnowflake("123456789012345678")).toBe(true);
      for (const value of ["", "-1", "1.2", "1e3", "abc", "9223372036854775808"]) expect(isSearchSnowflake(value)).toBe(false);
   });
});
