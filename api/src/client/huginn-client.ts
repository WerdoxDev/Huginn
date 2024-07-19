import { APIUser, LoginCredentials, RegisterUser, Tokens } from "@shared/api-types";
import { ClientOptions, ClientReadyState } from "../types";
import { AuthAPI } from "../apis/auth";
import { ChannelAPI } from "../apis/channel";
import { CommonAPI } from "../apis/common";
import { UserAPI } from "../apis/user";
import { Gateway } from "../gateway/client-gateway";
import { REST } from "../rest/rest";
import { TokenHandler } from "../rest/token-handler";
import { createDefaultClientOptions } from "../utils";
import { Snowflake, snowflake } from "@shared/snowflake";
import { RelationshipAPI } from "../apis/relationship";

export class HuginnClient {
   public readonly options: ClientOptions;
   private rest: REST;
   public tokenHandler: TokenHandler;
   public users: UserAPI;
   public relationships: RelationshipAPI;
   public auth: AuthAPI;
   public channels: ChannelAPI;
   public common: CommonAPI;
   public gateway: Gateway;

   public user?: APIUser;

   public readyState: ClientReadyState = ClientReadyState.NONE;

   constructor(options?: Partial<ClientOptions>) {
      const defaultOptions = createDefaultClientOptions();

      this.options = {
         ...defaultOptions,
         ...options,
      };

      this.tokenHandler = new TokenHandler(this);
      this.rest = new REST(this, this.options.rest);

      this.auth = new AuthAPI(this.rest);
      this.users = new UserAPI(this.rest);
      this.channels = new ChannelAPI(this.rest);
      this.relationships = new RelationshipAPI(this.rest);
      this.common = new CommonAPI(this.rest);
      this.gateway = new Gateway(this, this.options.gateway);
   }

   async initializeWithToken(tokens: Partial<Tokens>): Promise<void> {
      try {
         this.readyState = ClientReadyState.INITIALIZING;
         if (tokens.token) {
            this.tokenHandler.token = tokens.token;

            this.user = await this.users.getCurrent();
            this.readyState = ClientReadyState.READY;
         } else if (tokens.refreshToken) {
            const newTokens = await this.auth.refreshToken({ refreshToken: tokens.refreshToken });
            this.tokenHandler.refreshToken = newTokens.refreshToken;
            this.tokenHandler.token = newTokens.token;

            this.user = await this.users.getCurrent();
            this.readyState = ClientReadyState.READY;
         }
      } catch (e) {
         this.user = undefined;
         this.tokenHandler.token = null!;
         this.tokenHandler.refreshToken = null!;

         this.readyState = ClientReadyState.NONE;

         throw e;
      }
   }

   public async login(credentials: LoginCredentials): Promise<void> {
      this.readyState = ClientReadyState.INITIALIZING;
      const result = await this.auth.login(credentials);

      this.user = { ...result };
      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;
      this.readyState = ClientReadyState.READY;
   }

   public async register(user: RegisterUser): Promise<void> {
      this.readyState = ClientReadyState.INITIALIZING;
      const result = await this.auth.register(user);

      this.user = { ...result };
      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;
      this.readyState = ClientReadyState.INITIALIZING;
   }

   public async logout(): Promise<void> {
      await this.auth.logout();

      this.tokenHandler.token = null!;
      this.user = undefined;
      this.gateway.close();
   }

   public get isLoggedIn(): boolean {
      return this.user !== undefined;
   }

   public generateNonce(): Snowflake {
      const nonce = snowflake.generateString();
      return nonce;
   }
}
