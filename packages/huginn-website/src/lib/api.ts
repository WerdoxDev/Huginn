import type { APIGetStaffGameContributionsResult, APIGetStaffIGDBGamesResult, APIPostAcceptGameContributionResult, APIStaffUser } from "@huginnjs/shared";

const serverAddress = (import.meta.env.VITE_API_HOSTNAME ?? "https://midgard.huginn.dev").replace(/\/$/, "");
const apiRoot = `${serverAddress}/api`;
const staffRoutes = {
   me: "/staff/@me",
   contributions: "/staff/game-contributions",
   igdbGames: "/staff/igdb-games",
   acceptContribution: (id: number) => `/staff/game-contributions/${id}/accept`,
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

   return (await response.json()) as T;
}

export function getStaffMe(token: string) {
   return staffRequest<APIStaffUser>(staffRoutes.me, token);
}

export function getGameContributions(token: string) {
   return staffRequest<APIGetStaffGameContributionsResult>(staffRoutes.contributions, token);
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
