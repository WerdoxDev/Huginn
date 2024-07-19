import {
   APIDeleteDMChannelResult,
   APIGetChannelByIdResult,
   APIGetChannelMessagesResult,
   APIGetMessageByIdResult,
   APIGetUserChannelsResult,
   APIPostDMChannelJSONBody,
   APIPostDMChannelResult,
   APIPostDefaultMessageJSONBody,
   APIPostDefaultMessageResult,
} from "@shared/api-types";
import { Routes } from "@shared/routes";
import { Snowflake } from "@shared/snowflake";
import { REST } from "../rest/rest";

export class ChannelAPI {
   private readonly rest: REST;

   public constructor(rest: REST) {
      this.rest = rest;
   }

   public async get(channelId: Snowflake): Promise<APIGetChannelByIdResult> {
      return this.rest.get(Routes.channel(channelId), { auth: true }) as Promise<APIGetChannelByIdResult>;
   }

   public async getAll(): Promise<APIGetUserChannelsResult> {
      return this.rest.get(Routes.userChannels(), { auth: true }) as Promise<APIGetUserChannelsResult>;
   }

   public async getMessage(channelId: Snowflake, messageId: Snowflake): Promise<APIGetMessageByIdResult> {
      return this.rest.get(Routes.channelMessage(channelId, messageId), { auth: true }) as Promise<APIGetMessageByIdResult>;
   }

   public async getMessages(
      channelId: Snowflake,
      limit?: number,
      before?: Snowflake,
      after?: Snowflake
   ): Promise<APIGetChannelMessagesResult> {
      return this.rest.get(Routes.channelMessages(channelId), {
         auth: true,
         query: new URLSearchParams({
            ...(limit && { limit: limit.toString() }),
            ...(before && { before: before.toString() }),
            ...(after && { after: after.toString() }),
         }),
      }) as Promise<APIGetChannelMessagesResult>;
   }

   public async createDM(body: APIPostDMChannelJSONBody): Promise<APIPostDMChannelResult> {
      return this.rest.post(Routes.userChannels(), { body, auth: true }) as Promise<APIPostDMChannelResult>;
   }

   public async deleteDM(channelId: Snowflake): Promise<APIDeleteDMChannelResult> {
      return this.rest.delete(Routes.channel(channelId), { auth: true }) as Promise<APIDeleteDMChannelResult>;
   }

   public async createMessage(channelId: Snowflake, body: APIPostDefaultMessageJSONBody): Promise<APIPostDefaultMessageResult> {
      return this.rest.post(Routes.channelMessages(channelId), { body, auth: true }) as Promise<APIPostDefaultMessageResult>;
   }

   // public async typing(channelId: Snowflake) {
   //    return this.rest.post(Routes.channelTyping(channelId), { auth: true });
   // }
}
