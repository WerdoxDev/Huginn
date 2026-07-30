import type { GatewayIdentifyProperties, GatewayPayload, Snowflake } from "@huginnjs/shared";
import type { Peer } from "crossws";

import { CommonClientSession } from "@huginn/backend-shared";
import { prisma, selectRelationshipUser } from "@huginn/backend-shared/database";
import { ChannelType, RelationshipType, WorkerID } from "@huginnjs/shared";

export class ClientSession extends CommonClientSession<GatewayPayload, GatewayIdentifyProperties> {
   public get authenticated(): boolean {
      return !!this.user && !!this.properties;
   }

   public constructor(peer: Peer, sessionId: Snowflake, sentMessagesLimit: number) {
      super(peer, sessionId, WorkerID.GATEWAY, sentMessagesLimit);
   }

   public override async subscribeToTopics() {
      await super.subscribeToTopics();

      if (!this.authenticated || !this.user) {
         return;
      }

      const userId = this.user.id;

      const relationships = await prisma.relationship.getUserRelationships(userId, {
         select: { ...selectRelationshipUser, type: true },
      });
      const channels = await prisma.channel.getUserChannels(userId, true, {
         select: { id: true, recipients: { select: { id: true } }, type: true },
      });

      // public users include any user that we can see
      const publicUserIds = new Set([...relationships.map((x) => x.user.id), ...channels.flatMap((x) => x.recipients).map((x) => x.id)]);

      // TODO: CHANGE WHEN GUILDS ARE A THING
      // presence users include users that we can fully see their presence. This include group dms, friends, and later guilds
      const presenceUserIds = new Set([
         ...relationships.filter((x) => x.type === RelationshipType.FRIEND).map((x) => x.user.id),
         ...channels
            .filter((x) => x.type === ChannelType.GROUP_DM)
            .flatMap((x) => x.recipients)
            .map((x) => x.id),
      ]);

      presenceUserIds.delete(userId);
      publicUserIds.delete(userId);

      for (const channel of channels) {
         this.subscribe(channel.id);
      }

      // Users from Relationships
      for (const userId of publicUserIds) {
         this.subscribe(`${userId}_public`);
      }

      for (const userId of presenceUserIds) {
         this.subscribe(`${userId}_presence`);
      }
   }
}
