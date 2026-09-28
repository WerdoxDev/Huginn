import { nextApplicationCatalogRevision, prismaBase } from "@huginn/backend-shared/database/index";

import type { TwitchOAuthResult } from "#utils/types";

import { env } from "#setup";
import { serverFetch } from "#utils/server-request";

const knownGames = await prismaBase.knownGame.findMany();

type IGDBSearchResult = {
   id: number;
   name: string;
   rating: number;
   url: string;
   alternative_names?: Array<{ name: string }>;
   game_localizations?: Array<{ name: string }>;
};
const search = new URLSearchParams({
   client_id: env.IGDB_CLIENT_ID!,
   client_secret: env.IGDB_CLIENT_SECRET!,
   grant_type: "client_credentials",
});
const result: TwitchOAuthResult = await serverFetch("https://id.twitch.tv/oauth2/token", "POST", {
   query: search,
});
const token = result.access_token;

if (knownGames.length === 0) {
   process.exit(0);
}

const searchResult: IGDBSearchResult[] = await serverFetch("https://api.igdb.com/v4/games", "POST", {
   headers: { "Client-ID": env.IGDB_CLIENT_ID! },
   auth: true,
   token: token,
   body: `
      fields id,name,rating,url,alternative_names.name,game_localizations.name,game_type;
      where id = (${knownGames.map((game) => game.igdbId).join(",")});
      limit 500;
      `,
});

for (const knownGame of knownGames) {
   const result = searchResult.find((game) => game.id === knownGame.igdbId);
   if (!result) continue;

   const aliases = [
      ...(result.alternative_names ?? []).map((alternative) => alternative.name),
      ...(result.game_localizations ?? []).map((localization) => localization.name),
   ].filter((name, index, names) => name !== result.name && names.indexOf(name) === index);

   const unchanged =
      knownGame.canonicalName === result.name &&
      knownGame.aliases.length === aliases.length &&
      knownGame.aliases.every((alias, index) => alias === aliases[index]);
   if (unchanged) continue;

   await prismaBase.$transaction(async (transaction) => {
      const revision = await nextApplicationCatalogRevision(transaction);
      await transaction.knownGame.update({
         where: { id: knownGame.id },
         data: { canonicalName: result.name, aliases, revision },
      });
   });
}
