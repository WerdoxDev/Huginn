import { Snowflake } from "@shared/types";
import { REST } from "../rest/rest";
import { Routes } from "@shared/routes";
import {
   APIGetCurrentUserResult,
   APIGetUserResult,
   APIPatchCurrentUserJSONBody,
   APIPatchCurrentUserResult,
} from "@shared/api-types";

export class UserAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(userId: Snowflake) {
      return this.rest.get(Routes.user(userId)) as Promise<APIGetUserResult>;
   }

   public async getCurrent() {
      return this.rest.get(Routes.user("@me")) as Promise<APIGetCurrentUserResult>;
   }

   public async edit(body: APIPatchCurrentUserJSONBody) {
      return this.rest.patch(Routes.user("@me"), { body }) as Promise<APIPatchCurrentUserResult>;
   }
}
