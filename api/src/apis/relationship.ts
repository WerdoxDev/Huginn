import { APIGetUserRelationshipByIdResult, APIGetUserRelationshipsResult, APIPostRelationshipJSONBody } from "@shared/api-types";
import { Routes } from "@shared/routes";
import { Snowflake } from "@shared/snowflake";
import { REST } from "../rest/rest";

export class RelationshipAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(userId: Snowflake): Promise<APIGetUserRelationshipByIdResult> {
      return this.rest.get(Routes.userRelationship(userId), { auth: true }) as Promise<APIGetUserRelationshipByIdResult>;
   }

   public async getAll(): Promise<APIGetUserRelationshipsResult> {
      return this.rest.get(Routes.userRelationships(), { auth: true }) as Promise<APIGetUserRelationshipsResult>;
   }

   public async createRelationship(body: APIPostRelationshipJSONBody): Promise<unknown> {
      return this.rest.post(Routes.userRelationships(), { body, auth: true });
   }

   public async createRelationshipByUserId(userId: Snowflake): Promise<unknown> {
      return this.rest.put(Routes.userRelationship(userId), { auth: true });
   }

   public async delete(userId: Snowflake): Promise<unknown> {
      return this.rest.delete(Routes.userRelationship(userId), { auth: true });
   }
}
