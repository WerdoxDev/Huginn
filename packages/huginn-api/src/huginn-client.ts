import type { APIPostLoginResult, APIPostRegisterResult, APIUser, LoginCredentials, RegisterUser, Tokens } from "@huginn/shared";

import { type Snowflake, snowflake, WorkerID } from "@huginn/shared";
import { decodeJwt } from "jose";

import type { AuthenticationStatus, ClientOptions, VoiceConstructor } from ".";

import { CDN } from "./cdn";
import { Gateway } from "./gateway";
import { REST } from "./rest";
import { ApplicationAPI } from "./rest-apis/application";
import { AuthAPI } from "./rest-apis/auth";
import { ChannelAPI } from "./rest-apis/channel";
import { CommonAPI } from "./rest-apis/common";
import { GifAPI } from "./rest-apis/gif";
import { MessageAPI } from "./rest-apis/message";
import { OAuthAPI } from "./rest-apis/oauth";
import { RelationshipAPI } from "./rest-apis/relationship";
import { UserAPI } from "./rest-apis/user";
import { TokenHandler } from "./token-handler";
import { defaultClientOptions } from "./utils";
import { Voice } from "./voice";
import { VoiceManager } from "./voice-manager";

export type InitializationStatus = "success" | "timeout" | "network_error" | "invalid_tokens" | AuthenticationStatus;

export type InitializationResult = {
   success: boolean;
   status: InitializationStatus;
   retryable: boolean;
};

type RefreshTokenResult = {
   success: boolean;
   status: "success" | "invalid_token" | "network_error";
   retryable: boolean;
};

type ConnectOptions = {
   tokens?: Partial<Tokens>;
};

export class HuginnClient<V extends Voice = Voice> {
   public readonly options: ClientOptions<V>;

   public readonly rest: REST;
   public readonly cdn: CDN;
   public readonly tokenHandler: TokenHandler;
   public readonly gateway: Gateway;
   public readonly voice: V;
   public readonly voiceManager: VoiceManager;

   public readonly users: UserAPI;
   public readonly relationships: RelationshipAPI;
   public readonly auth: AuthAPI;
   public readonly channels: ChannelAPI;
   public readonly messages: MessageAPI;
   public readonly oauth: OAuthAPI;
   public readonly applications: ApplicationAPI;
   public readonly common: CommonAPI;
   public readonly gifs: GifAPI;

   private _user?: APIUser;

   constructor(options?: Partial<ClientOptions<V>>) {
      this.options = {
         ...(defaultClientOptions as ClientOptions<V>),
         ...options,
      };

      this.tokenHandler = new TokenHandler(this);
      this.rest = new REST(this, this.options.rest);
      this.cdn = new CDN(this.options.cdn);
      this.gateway = new Gateway(this, this.options.gateway);

      const VoiceClass = options?.voice?.class ?? (Voice as VoiceConstructor<V>);
      this.voice = new VoiceClass(this, this.options.voice);
      this.voiceManager = new VoiceManager<V>(this.gateway, this.voice);

      this.auth = new AuthAPI(this.rest);
      this.users = new UserAPI(this.rest);
      this.channels = new ChannelAPI(this.rest);
      this.messages = new MessageAPI(this.rest);
      this.relationships = new RelationshipAPI(this.rest);
      this.applications = new ApplicationAPI(this.rest);
      this.gifs = new GifAPI(this.rest);
      this.common = new CommonAPI(this.rest);
      this.oauth = new OAuthAPI(this.rest, this.gateway);

      this.gateway.connect();
   }

   public get currentUser(): APIUser | undefined {
      return this._user;
   }

   private setUser(user: APIUser | undefined): void {
      this._user = user;
   }

   public async initialize(options: ConnectOptions = {}): Promise<InitializationResult> {
      const { tokens } = options;
      try {
         if (tokens?.token || tokens?.refreshToken) {
            const tokenResult = await this.restoreSession(tokens);

            if (tokenResult === "invalid_tokens") {
               return { status: tokenResult, retryable: false, success: false };
            }

            if (tokenResult === "network_error") {
               return { status: tokenResult, retryable: true, success: false };
            }
         }

         if (!this.tokenHandler.token && !this.tokenHandler.refreshToken) {
            return { status: "invalid_tokens", retryable: false, success: false };
         }

         const authResult = await this.authenticate();

         if (!authResult.success) {
            return authResult;
         }

         this.setUser(this.gateway.user);

         return { success: true, status: "success", retryable: false };
      } catch {
         return { status: "authentication_failed", retryable: false, success: false };
      }
   }

   private async authenticate(): Promise<InitializationResult> {
      const result = await this.gateway.authenticate();

      // if (!result) {
      //    return { status: "timeout", success: false, retryable: true };
      // }

      if (!result.authenticated) {
         return {
            status: result.status,
            retryable: result.retryable ?? true,
            success: false,
         };
      }

      return { success: true, status: "success", retryable: false };
   }

   private async restoreSession(tokens: Partial<Tokens>): Promise<InitializationStatus> {
      const accessTokenValid = await this.validateAccessToken(tokens.token);
      if (!accessTokenValid && tokens.refreshToken) {
         const refreshResult = await this.refreshSession(tokens.refreshToken);

         // invalid tokens is handled further down
         if (refreshResult.success) return "success";
         if (refreshResult.status === "network_error") return "network_error";
      }

      if (accessTokenValid) {
         return "success";
      }

      this.clearSession();
      return "invalid_tokens";
   }

   public async validateAccessToken(token?: string): Promise<boolean> {
      if (!token) return false;

      try {
         const decoded = decodeJwt(token);
         const expireDate = (decoded.exp ?? 0) * 1000;
         const isValid = expireDate >= Date.now();

         if (isValid) {
            this.tokenHandler.token = token;
         }

         return isValid;
      } catch {
         return false;
      }
   }

   private async refreshSession(refreshToken: string): Promise<RefreshTokenResult> {
      try {
         const newTokens = await this.auth.refreshToken({ refreshToken });
         this.tokenHandler.token = newTokens.token;
         this.tokenHandler.refreshToken = newTokens.refreshToken;
         return { success: true, status: "success", retryable: true };
      } catch (e) {
         if (e instanceof TypeError && e.message.toLocaleLowerCase().includes("fail")) {
            return { success: false, status: "network_error", retryable: true };
         }
         return { success: false, status: "invalid_token", retryable: false };
      }
   }

   public clearSession(): void {
      this.tokenHandler.token = undefined;
      this.tokenHandler.refreshToken = undefined;
      this.setUser(undefined);
   }

   private cleanup(): void {
      this.clearSession();
      this.voice.signaling.close();
      this.gateway.close();
   }

   public async login(credentials: LoginCredentials): Promise<APIPostLoginResult> {
      const result = await this.auth.login(credentials);

      if ("token" in result && "refreshToken" in result) {
         this.tokenHandler.token = result.token;
         this.tokenHandler.refreshToken = result.refreshToken;
      }

      return result;
   }

   public async register(user: RegisterUser): Promise<APIPostRegisterResult> {
      const result = await this.auth.register(user);

      if ("token" in result && "refreshToken" in result) {
         this.tokenHandler.token = result.token;
         this.tokenHandler.refreshToken = result.refreshToken;
      }

      return result;
   }

   public async logout(): Promise<void> {
      try {
         await this.auth.logout();
      } catch {
         console.warn("logout failed but session was cleared anyway");
      } finally {
         this.cleanup();
      }
   }

   public generateNonce(): Snowflake {
      const nonce = snowflake.generateString(WorkerID.API);
      return nonce;
   }

   public checkUser(): asserts this is this & { currentUser: APIUser } {
      if (!this.currentUser) {
         throw new Error("Client user is null");
      }
   }
}
