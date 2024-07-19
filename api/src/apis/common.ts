import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@shared/api-types";
import { Routes } from "@shared/routes";
import { REST } from "../rest/rest";

export class CommonAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async uniqueUsername(body: APIPostUniqueUsernameJSONBody): Promise<APIPostUniqueUsernameResult> {
      return this.rest.post(Routes.uniqueUsername(), { body }) as Promise<APIPostUniqueUsernameResult>;
   }
}
