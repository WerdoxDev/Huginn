import { Routes, type APIGetKnownApplicationsResult } from "@huginn/shared";
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
}
