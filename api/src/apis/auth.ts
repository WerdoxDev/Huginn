import {
   APIPostLoginJSONBody,
   APIPostLoginResult,
   APIPostRefreshTokenJSONBody,
   APIPostRefreshTokenResult,
   APIPostRegisterJSONBody,
   APIPostRegisterResult,
} from "@shared/api-types";
import { Routes } from "@shared/routes";
import { REST } from "../rest/rest";

export class AuthAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async login(body: APIPostLoginJSONBody): Promise<APIPostLoginResult> {
      return this.rest.post(Routes.login(), { body }) as Promise<APIPostLoginResult>;
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
}
