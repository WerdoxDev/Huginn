import {
   Routes,
   type APIGetApplicationCatalogResult,
   type APIGetUserContributionsResult,
   type APIPostApplicationIconJSONBody,
   type APIPostApplicationIconResult,
   type APIPostApplicationCatalogJSONBody,
   type APIPostApplicationCatalogResult,
} from "@huginnjs/shared";

import type { REST } from "../rest";

export class ApplicationAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async getCatalog(cursor?: string): Promise<APIGetApplicationCatalogResult> {
      return this.rest.get(Routes.applicationCatalog(), {
         auth: true,
         query: cursor ? new URLSearchParams({ cursor }) : undefined,
      }) as Promise<APIGetApplicationCatalogResult>;
   }

   public async contribute(body: APIPostApplicationCatalogJSONBody): Promise<APIPostApplicationCatalogResult> {
      return this.rest.post(Routes.applicationCatalog(), {
         auth: true,
         body,
      }) as Promise<APIPostApplicationCatalogResult>;
   }

   public async getContributions(): Promise<APIGetUserContributionsResult> {
      return this.rest.get(Routes.applicationContributions(), { auth: true }) as Promise<APIGetUserContributionsResult>;
   }

   public async uploadIcon(body: APIPostApplicationIconJSONBody): Promise<APIPostApplicationIconResult> {
      return this.rest.post(Routes.applicationIcon(), {
         auth: true,
         body,
      }) as Promise<APIPostApplicationIconResult>;
   }
}
