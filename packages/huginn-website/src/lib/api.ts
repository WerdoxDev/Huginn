import {
   CDNRoutes,
   type APIGetStaffGameContributionsResult,
   type APIGetStaffIGDBGamesResult,
   type APIGetStaffKnownGamesResult,
   type APIPostAcceptGameContributionResult,
   type APIPublicUser,
} from "@huginnjs/shared";

const serverAddress = (import.meta.env.VITE_SERVER_ADDRESS ?? "https://midgard.huginn.dev").replace(/\/$/, "");
const cdnAddress = (import.meta.env.VITE_CDN_ADDRESS ?? "https://midgard.huginn.dev").replace(/\/$/, "");
const apiRoot = `${serverAddress}/api`;
const staffRoutes = {
   me: "/staff/@me",
   contributions: "/staff/game-contributions",
   igdbGames: "/staff/igdb-games",
   knownGames: "/staff/known-games",
   acceptContribution: (id: number) => `/staff/game-contributions/${id}/accept`,
   deleteKnownGame: (id: number) => `/staff/known-games/${id}`,
   rejectContribution: (id: number) => `/staff/game-contributions/${id}/reject`,
} as const;

export class StaffAPIError extends Error {
   public constructor(
      message: string,
      public readonly status: number,
   ) {
      super(message);
   }
}

async function staffRequest<T>(route: string, token: string, init: RequestInit = {}): Promise<T> {
   const response = await fetch(`${apiRoot}${route}`, {
      ...init,
      headers: {
         Accept: "application/json",
         authorization: `Bearer ${token}`,
         ...(init.body ? { "Content-Type": "application/json" } : {}),
         ...init.headers,
      },
   });

   if (!response.ok) {
      let message = response.status === 403 ? "This Huginn account is not a staff account." : "The request failed.";
      try {
         const body = (await response.json()) as { message?: string };
         message = body.message ?? message;
      } catch {
         // A plain-text server response has no additional error details.
      }
      throw new StaffAPIError(message, response.status);
   }

   if (response.status === 204) return undefined as T;

   return (await response.json()) as T;
}

export function getStaffMe(token: string) {
   return staffRequest<APIPublicUser>(staffRoutes.me, token);
}

export function getGameContributions(token: string) {
   return staffRequest<APIGetStaffGameContributionsResult>(staffRoutes.contributions, token);
}

export function getKnownGames(token: string) {
   return staffRequest<APIGetStaffKnownGamesResult>(staffRoutes.knownGames, token);
}

export function searchIGDB(token: string, query: string, signal?: AbortSignal) {
   const search = new URLSearchParams({ query });
   return staffRequest<APIGetStaffIGDBGamesResult>(`${staffRoutes.igdbGames}?${search}`, token, { signal });
}

export function acceptGameContribution(token: string, contributionId: number, body: import("@huginnjs/shared").APIPostAcceptGameContributionJSONBody) {
   return staffRequest<APIPostAcceptGameContributionResult>(staffRoutes.acceptContribution(contributionId), token, {
      method: "POST",
      body: JSON.stringify(body),
   });
}

export function rejectGameContribution(token: string, contributionId: number) {
   return staffRequest<undefined>(staffRoutes.rejectContribution(contributionId), token, {
      method: "POST",
   });
}

export function deleteKnownGame(token: string, gameId: number) {
   return staffRequest<undefined>(staffRoutes.deleteKnownGame(gameId), token, {
      method: "DELETE",
   });
}

export function getContributionIconUrl(iconUrl: string) {
   return `${cdnAddress}/cdn${iconUrl}`;
}
