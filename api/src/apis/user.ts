import { APIGetCurrentUserResult, APIGetUserResult, APIPatchCurrentUserJSONBody, APIPatchCurrentUserResult } from "@shared/api-types";
import { Routes } from "@shared/routes";
import { Snowflake } from "@shared/snowflake";
import { REST } from "../rest/rest";

export class UserAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(userId: Snowflake): Promise<APIGetUserResult> {
      return this.rest.get(Routes.user(userId), { auth: true }) as Promise<APIGetUserResult>;
   }

   public async getCurrent(): Promise<APIGetCurrentUserResult> {
      return this.rest.get(Routes.user("@me"), { auth: true }) as Promise<APIGetCurrentUserResult>;
   }

   public async edit(body: APIPatchCurrentUserJSONBody): Promise<APIPatchCurrentUserResult> {
      return this.rest.patch(Routes.user("@me"), { body, auth: true }) as Promise<APIPatchCurrentUserResult>;
   }
}
