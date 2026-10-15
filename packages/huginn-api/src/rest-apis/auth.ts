import type {
   APIPostLoginJSONBody,
   APIPostLoginResult,
   APIPostPasswordResetConfirmJSONBody,
   APIPostPasswordResetRequestJSONBody,
   APIPostNotificationTokenJSONBody,
   APIPostRefreshTokenJSONBody,
   APIPostRefreshTokenResult,
   APIPostRegisterJSONBody,
   APIPostRegisterResult,
} from "@huginnjs/shared";

import { Routes } from "@huginnjs/shared";

import type { REST } from "../rest";

export class AuthAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async login(body: APIPostLoginJSONBody): Promise<APIPostLoginResult> {
      return this.rest.post(Routes.login(), { body }) as Promise<APIPostLoginResult>;
   }

   public async requestPasswordReset(body: APIPostPasswordResetRequestJSONBody): Promise<void> {
      await this.rest.post(Routes.passwordResetRequest(), { body });
   }

   public async confirmPasswordReset(body: APIPostPasswordResetConfirmJSONBody, authenticated = false): Promise<void> {
      await this.rest.post(Routes.passwordResetConfirm(), { body, auth: authenticated });
   }

   public async register(body: APIPostRegisterJSONBody): Promise<APIPostRegisterResult> {
      return this.rest.post(Routes.register(), { body }) as Promise<APIPostRegisterResult>;
   }

   public async logout(): Promise<unknown> {
      return this.rest.post(Routes.logout(), { auth: true });
   }

   public async refreshToken(body: APIPostRefreshTokenJSONBody): Promise<APIPostRefreshTokenResult> {
      return this.rest.post(Routes.refreshToken(), { body }) as Promise<APIPostRefreshTokenResult>;
   }

   public async sendNotificationToken(body: APIPostNotificationTokenJSONBody): Promise<unknown> {
      return this.rest.post(Routes.notificationToken(), { body, auth: true });
   }
}
