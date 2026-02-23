import {
   type APIGetCurrentUserResult,
   type APIGetUserByIdResult,
   type APIPatchCurrentUserJSONBody,
   type APIPatchCurrentUserResult,
   type APIPatchUserSettingsJSONBody,
   type APIPatchUserSettingsResult,
   type APIPostVerifyEmailJSONBody,
   type APIPostVerifyEmailResult,
   Routes,
   type Snowflake,
   resolveImage,
} from "@huginn/shared";
import type { REST } from "../rest";

export class UserAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(userId: Snowflake): Promise<APIGetUserByIdResult> {
      return this.rest.get(Routes.user(userId), { auth: true }) as Promise<APIGetUserByIdResult>;
   }

   public async getCurrent(): Promise<APIGetCurrentUserResult> {
      return this.rest.get(Routes.user("@me"), { auth: true }) as Promise<APIGetCurrentUserResult>;
   }

   public async edit(body: APIPatchCurrentUserJSONBody): Promise<APIPatchCurrentUserResult> {
      const resolvedBody: APIPatchCurrentUserJSONBody = { ...body, avatar: body.avatar && (await resolveImage(body.avatar)) };
      return this.rest.patch(Routes.user("@me"), { body: resolvedBody, auth: true }) as Promise<APIPatchCurrentUserResult>;
   }

   public async editSettings(body: APIPatchUserSettingsJSONBody): Promise<APIPatchUserSettingsResult> {
      return this.rest.patch(Routes.userSettings(), { body, auth: true }) as Promise<APIPatchUserSettingsResult>;
   }

   public async verifyEmail(body: APIPostVerifyEmailJSONBody): Promise<APIPostVerifyEmailResult> {
      return this.rest.post(Routes.verifyEmail(), { body, auth: true }) as Promise<APIPostVerifyEmailResult>;
   }

   public async resendVerificationEmail(): Promise<void> {
      return this.rest.post(Routes.resendVerificationEmail(), { auth: true }) as Promise<void>;
   }
}
