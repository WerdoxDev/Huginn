import type { PageObjectResponse } from "@notionhq/client";

import { n2m, notion } from "#setup";
import { CacheStorage, type APIGetChangelogResult } from "@huginn/shared";
import Elysia, { t } from "elysia";
import * as semver from "semver";

function coerceVersion(value?: string | null) {
   return semver.coerce(value ?? "")?.version ?? null;
}

function getEntryVersion(entry: PageObjectResponse) {
   const versionProperty = entry.properties?.Version;
   if (!versionProperty || versionProperty.type !== "rich_text") return "null";

   const versionText = (versionProperty.rich_text ?? [])
      .map((item) => item.plain_text)
      .join("")
      .trim();
   return versionText ?? "";
}

function getEntryTitle(entry: PageObjectResponse) {
   const titleProperty = entry.properties?.Name;
   if (!titleProperty || titleProperty.type !== "title") return "";

   const titleText = (titleProperty.title ?? [])
      .map((item) => item.plain_text)
      .join("")
      .trim();
   return titleText ?? "";
}

function getEntryDate(entry: PageObjectResponse) {
   const dateProperty = entry.properties?.Date;
   if (!dateProperty || dateProperty.type !== "date" || !dateProperty.date) return "";

   return dateProperty.date.start;
}

const querySchema = t.Object({ since: t.Optional(t.String()), current: t.String() });

const contentCache = new CacheStorage<string, string>(60 * 60 * 1000); // Cache for 1 hour

export const getChangelog = new Elysia().get(
   "/api/changelog",
   async ({ status, query }) => {
      const entries = await notion.dataSources.query({
         data_source_id: "36bf7a65-d575-8078-b96c-000b8b219562",
         filter: { property: "Published", checkbox: { equals: true } },
         sorts: [{ property: "Date", direction: "descending" }],
      });

      const pages = entries.results.filter((entry): entry is PageObjectResponse => entry.object === "page");
      const sinceVersion = coerceVersion(query.since);

      const selectedPages = sinceVersion
         ? pages.filter((entry) => {
              const entryVersion = coerceVersion(getEntryVersion(entry));
              return entryVersion ? semver.gt(entryVersion, sinceVersion) && semver.lte(entryVersion, query.current) : false;
           })
         : pages.filter((entry) => {
              const entryVersion = coerceVersion(getEntryVersion(entry));
              const currentVersion = coerceVersion(query.current);
              return entryVersion && currentVersion ? semver.lte(entryVersion, currentVersion) : false;
           });

      if (selectedPages.length === 0) {
         return status("OK", []);
      }

      const result = await Promise.all(
         selectedPages.map(async (entry) => {
            const result = await contentCache.cacheOrGet(entry.id, async () => (await n2m.convert(entry.id)).content);
            return { title: getEntryTitle(entry), version: getEntryVersion(entry), content: result, date: getEntryDate(entry) };
         }),
      );

      const json: APIGetChangelogResult = result;
      return status("OK", json);
   },
   { query: querySchema },
);
