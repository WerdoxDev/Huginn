import { HuginnClient } from "..";
import { decodeToken } from "../utils";

export class TokenHandler {
   private _token?: string;
   private _refreshToken?: string;
   private tokenTimeout?: ReturnType<typeof setTimeout>;
   private timeoutPromise?: Promise<boolean>;

   private readonly client: HuginnClient;

   public constructor(client: HuginnClient) {
      this.client = client;
   }

   /**
    * Returns the authorization token as a readonly string
    */
   public get token(): Readonly<string | undefined> {
      return this._token;
   }

   /**
    * Sets the authorization tokens used by auth requests
    *
    * @param token - The authorization token to use
    */
   public set token(token: string) {
      this._token = token;

      const [isValid, payload] = decodeToken(token);

      if (!isValid || !payload) {
         return;
      }

      const date1 = new Date();
      const date2 = new Date((payload.exp ?? 0) * 1000);
      const diffTime = date2.getTime() - date1.getTime();

      this.startRefreshTimeout(diffTime - 5000);
   }

   /**
    * Returns the refresh token as a readonly string
    */
   public get refreshToken(): Readonly<string | undefined> {
      return this._refreshToken;
   }

   /**
    * Sets the refresh token used to get new tokens when they expire
    *
    * @param refreshToken - The refresh token to later get new authorization token with
    */
   public set refreshToken(refreshToken: string) {
      this._refreshToken = refreshToken;
   }

   /**
    * Returns a promise that waits for the token to refresh.
    * Result will be whether or not token got successfuly refreshed
    * Immidiatly returns a false if no timeout is in process
    */
   public async waitForTokenRefresh(): Promise<boolean> {
      return (await this.timeoutPromise) ?? false;
   }

   private startRefreshTimeout(time: number) {
      if (this.tokenTimeout != null) {
         clearTimeout(this.tokenTimeout);
      }

      this.timeoutPromise = new Promise<boolean>((resolve) => {
         this.tokenTimeout = setTimeout(async () => {
            const newTokens = await this.client.auth.refreshToken({ refreshToken: this.refreshToken ?? "" });

            this.token = newTokens.token;
            this.refreshToken = newTokens.refreshToken;

            console.log("Got new token");
            resolve(true);
         }, time);
      });
   }
}
