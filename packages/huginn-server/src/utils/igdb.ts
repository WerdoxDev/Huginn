import type { APIIGDBGameCandidate } from "@huginnjs/shared";

import type { IGDBSearchResult, TwitchOAuthResult } from "#utils/types";

import { env } from "#setup";

import { serverFetch } from "./server-request";

const GAME_FIELDS = [
   "id",
   "name",
   "rating",
   "url",
   "summary",
   "first_release_date",
   "cover.image_id",
   "genres.name",
   "platforms.name",
   "involved_companies.developer",
   "involved_companies.company.name",
   "alternative_names.name",
   "game_localizations.name",
].join(",");

let cachedToken: { value: string; expiresAt: number } | undefined;

function escapeSearch(value: string) {
   return value.replaceAll("\\", "\\\\").replaceAll('"', '\\"');
}

async function getAccessToken() {
   if (cachedToken && cachedToken.expiresAt > Date.now()) return cachedToken.value;

   const search = new URLSearchParams({
      client_id: env.IGDB_CLIENT_ID,
      client_secret: env.IGDB_CLIENT_SECRET,
      grant_type: "client_credentials",
   });
   const result: TwitchOAuthResult = await serverFetch("https://id.twitch.tv/oauth2/token", "POST", { query: search });

   cachedToken = {
      value: result.access_token,
      expiresAt: Date.now() + Math.max(0, result.expires_in - 60) * 1_000,
   };
   return cachedToken.value;
}

async function queryGames(body: string) {
   const token = await getAccessToken();
   return await serverFetch<IGDBSearchResult[]>("https://api.igdb.com/v4/games", "POST", {
      headers: { "Client-ID": env.IGDB_CLIENT_ID },
      auth: true,
      token,
      body,
   });
}

export async function searchIGDBGames(query: string) {
   return await queryGames(`fields ${GAME_FIELDS}; search "${escapeSearch(query)}"; limit 20;`);
}

export async function getIGDBGame(id: number) {
   const [game] = await queryGames(`fields ${GAME_FIELDS}; where id = ${id}; limit 1;`);
   return game;
}

export function toIGDBCandidate(game: IGDBSearchResult): APIIGDBGameCandidate {
   return {
      id: game.id,
      name: game.name,
      coverUrl: game.cover?.image_id ? `https://images.igdb.com/igdb/image/upload/t_cover_big/${game.cover.image_id}.jpg` : null,
      summary: game.summary ?? null,
      firstReleaseDate: game.first_release_date ?? null,
      rating: game.rating ?? null,
      url: game.url ?? null,
      genres: game.genres?.map((genre) => genre.name) ?? [],
      platforms: game.platforms?.map((platform) => platform.name) ?? [],
      developers: game.involved_companies?.filter((entry) => entry.developer).map((entry) => entry.company.name) ?? [],
   };
}
