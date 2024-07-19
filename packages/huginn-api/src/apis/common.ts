import { APIPostUniqueUsernameJSONBody, APIPostUniqueUsernameResult } from "@huginn/shared";
import { Routes } from "@huginn/shared";
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
