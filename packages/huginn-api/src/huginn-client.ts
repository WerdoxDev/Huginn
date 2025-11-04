import type { APIPostLoginResult, APIPostRegisterResult, APIUser, LoginCredentials, RegisterUser, Tokens } from "@huginn/shared";
import { type Snowflake, snowflake, WorkerID } from "@huginn/shared";
import { decodeJwt } from "jose";
import type { ClientOptions, VoiceConstructor } from ".";
import { CDN } from "./cdn";
import { Gateway } from "./gateway";
import { REST } from "./rest";
import { AuthAPI } from "./rest-apis/auth";
import { ChannelAPI } from "./rest-apis/channel";
import { CommonAPI } from "./rest-apis/common";
import { OAuthAPI } from "./rest-apis/oauth";
import { RelationshipAPI } from "./rest-apis/relationship";
import { UserAPI } from "./rest-apis/user";
import { TokenHandler } from "./token-handler";
import { defaultClientOptions } from "./utils";
import { ApplicationAPI } from "./rest-apis/application";
import { Voice } from "./voice";
import { VoiceManager } from "./voice-manager";

export class HuginnClient<V extends Voice = Voice> {
   public readonly options: ClientOptions<V>;
   private rest: REST;
   public cdn: CDN;
   public tokenHandler: TokenHandler;
   public users: UserAPI;
   public relationships: RelationshipAPI;
   public auth: AuthAPI;
   public channels: ChannelAPI;
   public oauth: OAuthAPI;
   public applications: ApplicationAPI;
   public common: CommonAPI;
   public gateway: Gateway;
   public voice: V;
   public voiceManager: VoiceManager;

   public user?: APIUser;

   constructor(options?: Partial<ClientOptions<V>>) {
      this.options = {
         ...(defaultClientOptions as ClientOptions<V>),
         ...options,
      };

      this.tokenHandler = new TokenHandler(this);
      this.rest = new REST(this, this.options.rest);
      this.cdn = new CDN(this.options.cdn);

      this.auth = new AuthAPI(this.rest);
      this.users = new UserAPI(this.rest);
      this.channels = new ChannelAPI(this.rest);
      this.relationships = new RelationshipAPI(this.rest);
      this.applications = new ApplicationAPI(this.rest);
      this.common = new CommonAPI(this.rest);
      this.gateway = new Gateway(this, this.options.gateway);

      const VoiceClass = options?.voice?.class ?? (Voice as VoiceConstructor<V>);
      this.voice = new VoiceClass(this, this.options.voice);

      this.voiceManager = new VoiceManager<V>(this.gateway, this.voice);

      this.oauth = new OAuthAPI(this.rest, this.gateway);
   }

   /**
    * Validates and sets tokens in the tokenHandler class instance
    * @param tokens An object with access and refresh tokens
    * @returns An status object indicating if initialization was successful with the provided tokens and wether or not it can be retried in case of a failure
    */
   async initializeWithToken(tokens: Partial<Tokens>): Promise<{ status: boolean; retryable: boolean }> {
      let tokenValid = false;
      let refreshTokenValid = false;

      try {
         if (tokens.token) {
            // decodeJwt can throw by it self. We don't want that to return a false status immediately
            try {
               const expireDate = (decodeJwt(tokens.token).exp ?? 0) * 1000;

               // Token expired
               tokenValid = expireDate >= Date.now();

               if (tokenValid) {
                  this.tokenHandler.token = tokens.token;
               }
               // oxlint-disable-next-line no-unused-vars
            } catch (e) {
               tokenValid = false;
            }
         }

         if (tokens.refreshToken) {
            const newTokens = await this.auth.refreshToken({ refreshToken: tokens.refreshToken });
            this.tokenHandler.refreshToken = newTokens.refreshToken;
            this.tokenHandler.token = newTokens.token;
            refreshTokenValid = true;
         }

         // No tokens was passed or some validation went wrong
         if (!tokenValid && !refreshTokenValid) {
            return { status: false, retryable: false };
         }

         return { status: true, retryable: true };
      } catch (e) {
         this.user = undefined;
         this.tokenHandler.refreshToken = undefined;

         // If the error is network related. Like not having network. "Failed to connect..."
         if (e instanceof TypeError && e.message.toLowerCase().includes("fail")) {
            // A network error can happen almost with no delay. So having this little delay helps with not having 9999 requests a second
            await new Promise((r) => setTimeout(r, 1000));
            return { status: false, retryable: true };
         }

         // If only refresh token failed, You can still use the access token
         if (tokenValid) {
            return { status: true, retryable: true };
         }

         this.tokenHandler.token = undefined;

         return { status: false, retryable: false };
      }
   }

   public async login(credentials: LoginCredentials): Promise<APIPostLoginResult> {
      const result = await this.auth.login(credentials);

      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;

      return result;
   }

   public async register(user: RegisterUser): Promise<APIPostRegisterResult> {
      const result = await this.auth.register(user);

      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;

      return result;
   }

   public async logout(): Promise<void> {
      await this.auth.logout();

      this.tokenHandler.token = undefined;
      this.tokenHandler.refreshToken = undefined;
      this.user = undefined;
      this.voice.signaling.close();
      if (this.gateway.status !== "disconnected" && this.gateway.status !== "none" && this.gateway.status !== "reconnecting") {
         this.gateway.close();
         await this.gateway.waitForEvents(["close"]);
      }
   }

   public generateNonce(): Snowflake {
      const nonce = snowflake.generateString(WorkerID.API);
      return nonce;
   }

   public checkUser(): asserts this is this & { user: APIUser } {
      if (!this.user) {
         throw new Error("Client user is null");
      }
   }
}
