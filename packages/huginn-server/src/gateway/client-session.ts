import { CommonClientSession } from "@huginn/backend-shared";
import { prisma } from "@huginn/backend-shared/database";
import { selectRelationshipUser } from "@huginn/backend-shared/database/common";
import type { GatewayIdentifyProperties, GatewayPayload } from "@huginn/shared";
import { ChannelType, RelationshipType } from "@huginn/shared";

export class ClientSession extends CommonClientSession<GatewayPayload, GatewayIdentifyProperties> {
   public get authenticated(): boolean {
      return !!this.user && !!this.properties;
   }

   public async subscribeToTopicsExtra() {
      if (!this.sessionId || !this.user) {
         throw new Error("Client session was not initialized");
      }

      const userId = this.user?.id;
      this.subscribe(userId);

      const relationships = await prisma.relationship.getUserRelationships(userId, { select: { ...selectRelationshipUser, type: true } });
      const channels = await prisma.channel.getUserChannels(userId, true, {
         select: { id: true, recipients: { select: { id: true } }, type: true },
      });

      // public users include any user that we can see
      const publicUserIds = [...new Set([...relationships.map((x) => x.user.id), ...channels.flatMap((x) => x.recipients).map((x) => x.id)])];

      // TODO: CHANGE WHEN GUILDS ARE A THING
      // presence users include users that we can fully see their presence. This include group dms, friends, and later guilds
      const presenceUserIds = [
         ...new Set([
            ...relationships.filter((x) => x.type === RelationshipType.FRIEND).map((x) => x.user.id),
            ...channels
               .filter((x) => x.type === ChannelType.GROUP_DM)
               .flatMap((x) => x.recipients)
               .map((x) => x.id),
         ]),
      ];

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
