import {
   APIGetCurrentUserResult,
   APIGetUserResult,
   APIPatchCurrentUserJSONBody,
   APIPatchCurrentUserResult,
   resolveImage,
   Routes,
   Snowflake,
} from "@huginn/shared";
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
      const resolvedBody: APIPatchCurrentUserJSONBody = { ...body, avatar: body.avatar && (await resolveImage(body.avatar)) };
      return this.rest.patch(Routes.user("@me"), { body: resolvedBody, auth: true }) as Promise<APIPatchCurrentUserResult>;
   }
}
