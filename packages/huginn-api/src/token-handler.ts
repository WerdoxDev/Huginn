import type { Tokens } from "@huginnjs/shared";

import { CONSTANTS, HuginnAPIError } from "@huginnjs/shared";

import type { HuginnClient } from ".";

import { decodeToken } from "./utils";

export class TokenHandler {
   private _token?: string;
   private _refreshToken?: string;
   private _sessionVersion = 0;
   private tokenTimeout?: ReturnType<typeof setTimeout>;
   private timeoutPromise?: Promise<boolean>;
   private resolveTimeout?: (success: boolean) => void;
   private refreshPromise?: Promise<boolean>;
   private changeListeners = new Set<(token?: string, refreshToken?: string) => void>();

   private readonly client: HuginnClient;

   public constructor(client: HuginnClient) {
      this.client = client;
   }

   public get token(): Readonly<string | undefined> {
      return this._token;
   }

   public set token(token: string | undefined) {
      this.setTokens({ token, refreshToken: this._refreshToken });
   }

   public get refreshToken(): Readonly<string | undefined> {
      return this._refreshToken;
   }

   public set refreshToken(refreshToken: string | undefined) {
      this.setTokens({ token: this._token, refreshToken });
   }

   /** Changes on session replacement or clearing, but not on automatic rotation. */
   public get sessionVersion(): number {
      return this._sessionVersion;
   }

   /** Publish a complete pair so persistence never observes mismatched credentials. */
   public setTokens(tokens: Partial<Tokens>): void {
      this._sessionVersion++;
      this.refreshPromise = undefined;
      this.applyTokens(tokens);
   }

   private applyTokens(tokens: Partial<Tokens>): void {
      this.cancelRefreshTimeout();
      this._token = tokens.token;
      this._refreshToken = tokens.refreshToken;

      const [isValid, payload] = this._token ? decodeToken(this._token) : [false, null];
      if (this._refreshToken && isValid && payload?.exp) {
         const remaining = payload.exp * 1000 - Date.now();
         const leadTime = Math.min(30_000, Math.max(1000, remaining / 10));
         this.startRefreshTimeout(remaining - leadTime);
      }

      for (const listener of this.changeListeners) listener(this._token, this._refreshToken);
   }

   public onChange(listener: (token?: string, refreshToken?: string) => void): () => void {
      this.changeListeners.add(listener);
      return () => this.changeListeners.delete(listener);
   }

   /** Wait for an active refresh, or refresh an expired token after a delayed timer. */
   public async ensureValidToken(): Promise<boolean> {
      if (this.refreshPromise) {
         await this.refreshPromise;
         return !!this._token;
      }

      if (this._token) {
         const [isValid, payload] = decodeToken(this._token);
         // Tokens without readable expiry metadata are left for the server to validate.
         if (!isValid || payload?.exp === undefined || payload.exp * 1000 > Date.now()) return true;
      }

      return this.refresh();
   }

   /** Share a single rotation across timers, requests and gateway authentication. */
   public refresh(): Promise<boolean> {
      if (this.refreshPromise) return this.refreshPromise;
      const refreshToken = this._refreshToken;
      if (!refreshToken) return Promise.resolve(false);

      this.cancelRefreshTimeout();
      const version = this._sessionVersion;
      const promise = Promise.resolve().then(async () => {
         if (version !== this._sessionVersion) return false;
         try {
            const tokens = await this.client.auth.refreshToken({ refreshToken });
            if (version !== this._sessionVersion) return false;
            this.applyTokens(tokens);
            return true;
         } catch (error) {
            if (version !== this._sessionVersion) return false;
            if (error instanceof HuginnAPIError && (error.status === 401 || error.status === 403)) {
               this.setTokens({});
            } else {
               this.startRefreshTimeout(CONSTANTS.TOKEN_REFRESH_RETRY_DELAY_MS);
            }
            throw error;
         }
      });

      this.refreshPromise = promise;
      const cleanup = () => {
         if (this.refreshPromise === promise) this.refreshPromise = undefined;
      };
      void promise.then(cleanup, cleanup);
      return promise;
   }

   /** Wait for the active or scheduled refresh; failures are reported as false. */
   public async waitForTokenRefresh(): Promise<boolean> {
      try {
         return (await (this.refreshPromise ?? this.timeoutPromise)) ?? false;
      } catch {
         return false;
      }
   }

   private startRefreshTimeout(time: number): void {
      this.cancelRefreshTimeout();
      this.timeoutPromise = new Promise<boolean>((resolve) => {
         this.resolveTimeout = resolve;
         this.tokenTimeout = setTimeout(
            () => {
               this.tokenTimeout = undefined;
               this.resolveTimeout = undefined;
               void this.refresh().then(resolve, () => resolve(false));
            },
            Math.max(0, time),
         );
      });
   }

   private cancelRefreshTimeout(): void {
      if (this.tokenTimeout !== undefined) clearTimeout(this.tokenTimeout);
      this.tokenTimeout = undefined;
      this.resolveTimeout?.(false);
      this.resolveTimeout = undefined;
      this.timeoutPromise = undefined;
   }
}
