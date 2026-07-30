import type { APIGetChangelogResult, APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@huginnjs/shared";

import { Routes } from "@huginnjs/shared";

import type { REST } from "../rest";

export class CommonAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async uniqueUsername(body: APIPostUniqueUsernameJSONBody): Promise<APIPostUniqueUsernameResult> {
      return this.rest.post(Routes.uniqueUsername(), {
         body,
      }) as Promise<APIPostUniqueUsernameResult>;
   }

   public async changelog(version: string, since?: string): Promise<APIGetChangelogResult> {
      const queryParams = new URLSearchParams({ current: version });
      if (since) queryParams.set("since", since);

      return this.rest.get(Routes.changelog(), { query: queryParams }) as Promise<APIGetChangelogResult>;
   }
}
