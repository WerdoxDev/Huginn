import { envs } from "#setup";
import { filterKnownApplication } from "#utils/helpers";
import { serverFetch } from "#utils/server-request";
import type { TwitchOAuthResult, IGDBSearchResult } from "#utils/types";
import { createRoute, invalidFormBody, notFound, singleError, validator, verifyJwt } from "@huginn/backend-shared";
import { prisma, selectKnownApplication } from "@huginn/backend-shared/database/index";
import { constants, Errors, findClosestString, HttpCode, type APIPostKnownApplicationResult } from "@huginn/shared";
import z from "zod";

const schema = z.object({ windowTitle: z.string(), exePath: z.string() });

createRoute("POST", "/api/applications/known", verifyJwt(), validator("json", schema), async (c) => {
   const body = c.req.valid("json");
   const payload = c.get("tokenPayload");
   const exeName = body.exePath.split(/[/\\]+/).pop();

   let title = body.windowTitle.trim();
   title = title.replace(/[\u00A9\u00AE\u2120\u2122\u2117\u1F12E\u1F12F]/g, "");

   if (!exeName) {
      return invalidFormBody(c);
   }

   const search = new URLSearchParams({ client_id: envs.IGDB_CLIENT_ID!, client_secret: envs.IGDB_CLIENT_SECRET!, grant_type: "client_credentials" });
   const result: TwitchOAuthResult = await serverFetch("https://id.twitch.tv/oauth2/token", "POST", { query: search });
   const token = result.access_token;

   let searchResult: IGDBSearchResult[] = await serverFetch("https://api.igdb.com/v4/games", "POST", {
      headers: { "Client-ID": envs.IGDB_CLIENT_ID! },
      auth: true,
      token: token,
      body: `
      fields id,name,rating,url,alternative_names.name,game_type;
      search "${title}";
      where platforms = (6,53);
      `,
   });

   const searchableNames: Array<{ id: number; name: string }> = [];

   for (const search of searchResult) {
      searchableNames.push({ id: search.id, name: search.name });
      if (search.alternative_names && search.alternative_names.length !== 0) {
         searchableNames.push(...search.alternative_names.map((x) => ({ id: search.id, name: x.name })));
      }
   }

   if (await prisma.knownApplication.exists({ names: { hasSome: searchableNames.map((x) => x.name) }, exeName: exeName })) {
      return singleError(c, Errors.knownApplicationExists());
   }

   const bestMatch = findClosestString(
      title,
      searchableNames.map((x) => x.name),
   );

   if (bestMatch.similarity >= constants.KNOWN_APPLICATION_SIMILARITY_THRESHOLD) {
      const resultMatch = searchableNames.find((x) => x.name === bestMatch.match);

      const names = searchableNames.filter((x) => x.id === resultMatch?.id).map((x) => x.name);

      const createdKnownApplication = await prisma.knownApplication.createOne(
         { names, exeName, contributorId: payload.id, igdbId: resultMatch?.id, isActive: true },
         { select: selectKnownApplication },
      );

      const json: APIPostKnownApplicationResult = filterKnownApplication(createdKnownApplication);
      return c.json(json, HttpCode.CREATED);
   } else {
      // Create an inactive field just to have user submissions recorded
      await prisma.knownApplication.createOne(
         { names: [title], exeName: exeName ?? "", contributorId: payload.id, isActive: false },
         { select: selectKnownApplication },
      );
   }

   return notFound(c);
});
