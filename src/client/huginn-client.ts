import { ClientOptions, LoginCredentials, RegisterUser } from "@shared/client-types";
import { createDefaultClientOptions } from "../utils";
import { REST } from "../rest/rest";
import { APIUser, Tokens } from "@shared/api-types";
import { UserAPI } from "../apis/user-api";
import { AuthAPI } from "../apis/auth-api";
import { CommonAPI } from "../apis/common-api";
import { TokenHandler } from "../rest/token-handler";
import { ChannelAPI } from "../apis/channel-api";
import { Gateway } from "../gateway/gateway";

export class HuginnClient {
   public readonly options: ClientOptions;
   private rest: REST;
   public tokenHandler: TokenHandler;
   public users: UserAPI;
   public auth: AuthAPI;
   public channels: ChannelAPI;
   public common: CommonAPI;
   public gateway: Gateway;

   public user?: APIUser;

   constructor(options?: Partial<ClientOptions>) {
      const defaultOptions = createDefaultClientOptions();

      this.options = {
         ...defaultOptions,
         ...options,
      };

      this.tokenHandler = new TokenHandler(this);
      this.rest = new REST(this, this.options.rest);

      this.users = new UserAPI(this.rest);
      this.auth = new AuthAPI(this.rest);
      this.channels = new ChannelAPI(this.rest);
      this.common = new CommonAPI(this.rest);
      this.gateway = new Gateway(this, this.options.gateway);
   }

   async initializeWithToken(tokens: Partial<Tokens>) {
      try {
         if (tokens.token) {
            this.tokenHandler.token = tokens.token;

            this.user = await this.users.getCurrent();
         } else if (tokens.refreshToken) {
            const newTokens = await this.auth.refreshToken({ refreshToken: tokens.refreshToken });
            this.tokenHandler.refreshToken = newTokens.refreshToken;
            this.tokenHandler.token = newTokens.token;

            this.user = await this.users.getCurrent();
         }
      } catch (e) {
         this.user = undefined;
         this.tokenHandler.token = null!;
         this.tokenHandler.refreshToken = null!;

         throw e;
      }
   }

   async login(credentials: LoginCredentials) {
      const result = await this.auth.login(credentials);

      this.user = { ...result };
      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;
   }

   async register(user: RegisterUser) {
      const result = await this.auth.register(user);

      this.user = { ...result };
      this.tokenHandler.token = result.token;
      this.tokenHandler.refreshToken = result.refreshToken;
   }

   public get isLoggedIn() {
      return this.user !== undefined;
   }
}
