import { envs } from "#setup";
import { filterKnownApplication } from "#utils/helpers";
import { serverFetch } from "#utils/server-request";
import { createRoute, notFound, singleError, validator, verifyJwt } from "@huginn/backend-shared";
import { prisma, selectKnownApplication } from "@huginn/backend-shared/database/index";
import { constants, Errors, findClosestString, HttpCode, type APIPostKnownApplicationResult } from "@huginn/shared";
import z from "zod";

const schema = z.object({ windowTitle: z.string(), exePath: z.string() });

type TwitchOAuthResult = { access_token: string; expires_in: number };
type IGDBSearchResult = { id: number; name: string; rating: number; url: string; alternative_names: Array<{ name: string }> };

createRoute("POST", "/api/applications/known", verifyJwt(), validator("json", schema), async (c) => {
   const body = c.req.valid("json");
   const payload = c.get("tokenPayload");
   const exeName = body.exePath.split(/[/\\]+/).pop();
   const title = body.windowTitle.trim();

   if (await prisma.knownApplication.exists({ name: title })) {
      return singleError(c, Errors.knownApplicationExists());
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
      where platforms = [6];
      `,
   });

   const searchableNames: Array<{ id: number; name: string }> = [];

   for (const search of searchResult) {
      searchableNames.push({ id: search.id, name: search.name });
      if (search.alternative_names.length !== 0) {
         searchableNames.push(...search.alternative_names.map((x) => ({ id: search.id, name: x.name })));
      }
   }

   const bestMatch = findClosestString(
      title,
      searchableNames.map((x) => x.name),
   );

   if (bestMatch.similarity >= constants.KNOWN_APPLICATION_SIMILARITY_THRESHOLD) {
      const name = bestMatch.match;

      if (!name || !exeName) {
         return notFound(c);
      }

      const resultMatch = searchableNames.find((x) => x.name === bestMatch.match);

      const createdKnownApplication = await prisma.knownApplication.createOne(
         { name, exeName, contributorId: payload.id, igdbId: resultMatch?.id, isActive: true },
         { select: selectKnownApplication },
      );

      const json: APIPostKnownApplicationResult = filterKnownApplication(createdKnownApplication);
      return c.json(json, HttpCode.CREATED);
   } else {
      // Create an inactive field just to have user submissions recorded
      await prisma.knownApplication.createOne(
         { name: title, exeName: exeName ?? "", contributorId: payload.id, isActive: false },
         { select: selectKnownApplication },
      );
   }

   return notFound(c);
});
