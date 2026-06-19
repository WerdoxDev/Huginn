import { prisma } from "@huginn/backend-shared/database/index";

import type { TwitchOAuthResult } from "#utils/types";

import { envs } from "#setup";
import { serverFetch } from "#utils/server-request";

const knownApplications = await prisma.knownApplication.findMany({
   where: { igdbId: { not: null } },
});

type IGDBSearchResult = {
   id: number;
   name: string;
   rating: number;
   url: string;
   alternative_names?: Array<{ name: string }>;
};
const search = new URLSearchParams({
   client_id: envs.IGDB_CLIENT_ID!,
   client_secret: envs.IGDB_CLIENT_SECRET!,
   grant_type: "client_credentials",
});
const result: TwitchOAuthResult = await serverFetch("https://id.twitch.tv/oauth2/token", "POST", {
   query: search,
});
const token = result.access_token;

let searchResult: IGDBSearchResult[] = await serverFetch("https://api.igdb.com/v4/games", "POST", {
   headers: { "Client-ID": envs.IGDB_CLIENT_ID! },
   auth: true,
   token: token,
   body: `
      fields id,name,rating,url,alternative_names.name,game_type;
      where id = (${knownApplications.map((x) => x.igdbId).join(",")});
      limit 500;
      `,
});

const names: Array<{ id: number; name: string }> = [];
for (const result of searchResult) {
   names.push({ name: result.name, id: result.id });
   if (result.alternative_names && result.alternative_names.length !== 0) {
      names.push(...result.alternative_names.map((x) => ({ id: result.id, name: x.name })));
   }
}

for (const application of knownApplications) {
   const foundNames = names.filter((x) => x.id === application.igdbId);
   application.names = foundNames.map((x) => x.name);
}

for (const application of knownApplications) {
   await prisma.knownApplication.update({ where: { id: application.id }, data: application });
}
