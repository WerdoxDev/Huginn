import { type LogArgs, Routes } from "@huginn/shared";
import type { HuginnClient } from "../huginn-client";
import type { REST } from "../rest";

export class LogAPI {
   private readonly rest: REST;
   private readonly client: HuginnClient;

   public constructor(rest: REST, client: HuginnClient) {
      this.rest = rest;
      this.client = client;
   }

   public async sendLog(logs: Array<{ section: string, level: string, args: LogArgs[] }>): Promise<unknown> {
      const token = this.client.tokenHandler.token
      return await this.rest.post(Routes.log(), { body: { token, logs: logs } });
   }
}
