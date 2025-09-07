import { Routes, type APIGetKnownApplicationsResult, type APIPostApplicationIconJSONBody, type APIPostApplicationIconResult } from "@huginn/shared";
import type { REST } from "../rest";

export class ApplicationAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async getKnown(since?: Date): Promise<APIGetKnownApplicationsResult> {
      return this.rest.get(Routes.knownApplications(), {
         auth: true,
         query: since ? new URLSearchParams({ since: since.getTime().toString() }) : undefined,
      }) as Promise<APIGetKnownApplicationsResult>;
   }

   public async uploadIcon(body: APIPostApplicationIconJSONBody): Promise<APIPostApplicationIconResult> {
      return this.rest.post(Routes.applicationIcon(), { auth: true, body }) as Promise<APIPostApplicationIconResult>;
   }
}
