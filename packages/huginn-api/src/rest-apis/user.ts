import {
   type APIGetAuthMethodsResult,
   type APIPostConnectOAuthProviderResult,
   type APIGetDevicesResult,
   type APIGetCurrentUserResult,
   type APIGetProfileResult,
   type APIGetUserByIdResult,
   type APIPatchCurrentUserJSONBody,
   type APIPatchCurrentUserResult,
   type APIPatchUserSettingsJSONBody,
   type APIPatchUserSettingsResult,
   type APIPostVerifyEmailJSONBody,
   type APIPostVerifyEmailResult,
   type OAuthProvider,
   Routes,
   type Snowflake,
   resolveImage,
} from "@huginnjs/shared";

import type { REST } from "../rest";

export class UserAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(userId: Snowflake): Promise<APIGetUserByIdResult> {
      return this.rest.get(Routes.user(userId), { auth: true }) as Promise<APIGetUserByIdResult>;
   }

   public async getProfile(userId: Snowflake): Promise<APIGetProfileResult> {
      return this.rest.get(Routes.userProfile(userId), { auth: true }) as Promise<APIGetProfileResult>;
   }

   public async getCurrent(): Promise<APIGetCurrentUserResult> {
      return this.rest.get(Routes.user("@me"), { auth: true }) as Promise<APIGetCurrentUserResult>;
   }

   public async getAuthMethods(): Promise<APIGetAuthMethodsResult> {
      return this.rest.get(Routes.authMethods(), { auth: true }) as Promise<APIGetAuthMethodsResult>;
   }

   public async connectOAuthProvider(provider: OAuthProvider, password?: string): Promise<APIPostConnectOAuthProviderResult> {
      return this.rest.post(Routes.connectAuthMethod(provider), { auth: true, body: { password } }) as Promise<APIPostConnectOAuthProviderResult>;
   }

   public async disconnectOAuthProvider(provider: OAuthProvider, password?: string): Promise<void> {
      await this.rest.delete(Routes.authMethod(provider), { auth: true, body: { password } });
   }

   public async getDevices(): Promise<APIGetDevicesResult> {
      return this.rest.get(Routes.devices(), { auth: true }) as Promise<APIGetDevicesResult>;
   }

   public async logoutDevice(id: string): Promise<void> {
      await this.rest.delete(Routes.device(id), { auth: true });
   }

   public async edit(body: APIPatchCurrentUserJSONBody): Promise<APIPatchCurrentUserResult> {
      const resolvedBody: APIPatchCurrentUserJSONBody = {
         ...body,
         avatar: body.avatar && (await resolveImage(body.avatar)),
      };
      return this.rest.patch(Routes.user("@me"), {
         body: resolvedBody,
         auth: true,
      }) as Promise<APIPatchCurrentUserResult>;
   }

   public async editSettings(body: APIPatchUserSettingsJSONBody): Promise<APIPatchUserSettingsResult> {
      return this.rest.patch(Routes.userSettings(), {
         body,
         auth: true,
      }) as Promise<APIPatchUserSettingsResult>;
   }

   public async verifyEmail(body: APIPostVerifyEmailJSONBody): Promise<APIPostVerifyEmailResult> {
      return this.rest.post(Routes.verifyEmail(), {
         body,
      }) as Promise<APIPostVerifyEmailResult>;
   }

   public async resendVerificationEmail(): Promise<void> {
      return this.rest.post(Routes.resendVerificationEmail(), { auth: true }) as Promise<void>;
   }
}
