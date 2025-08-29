import { type PresenceStatus, type PresenceUser, type Snowflake, type UserPresence, type UserSettings, log, omit, pick } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import type { ClientSession } from "./client-session";
import type { ServerUserPresence } from "@huginn/backend-shared";

export class PresenceManager {
   private presences: Map<Snowflake, ServerUserPresence>;

   public constructor() {
      this.presences = new Map();
   }

   public setUserPresence(userId: Snowflake, session: ClientSession, settings: UserSettings) {
      log("server:presence-manager", "default", "set", "uid:", userId, "sid:", session.sessionId, "sts:", settings.status);

      const existingPresence = this.presences.get(userId);

      const presence: ServerUserPresence = {
         userId: userId,
         status: existingPresence?.status ?? settings.status,
         activeSessions: [...(existingPresence?.activeSessions ?? []).filter((x) => x !== session.sessionId), session.sessionId],
      };

      log("server:presence-manager", "detail", "active sessions", "uid:", userId, presence.activeSessions.join(", "));

      this.presences.set(userId, presence);

      if (presence.status !== "offline") {
         log("server:presence-manager", "send", "presence_update", "uid:", userId, "sts:", presence.status);
         dispatchToTopic(`${userId}_presence`, "presence_update", this.convertToGatewayPresence(presence, { id: userId }));
      }
   }

   public updateUserPresence(userId: Snowflake, user?: PresenceUser, status?: PresenceStatus) {
      log("server:presence-manager", "default", "update", "uid:", userId);

      const existingPresence = this.presences.get(userId);
      if (existingPresence) {
         const newPresence: ServerUserPresence = {
            ...existingPresence,
            userId: userId,
            status: status ?? existingPresence.status,
         };
         this.presences.set(userId, newPresence);

         log("server:presence-manager", "send", "presence_update", "uid:", userId, "sts:", newPresence.status);
         dispatchToTopic(`${userId}_presence`, "presence_update", this.convertToGatewayPresence(newPresence, user ?? { id: userId }));
      }
   }

   public removeUserPresence(userId: Snowflake, session: ClientSession) {
      log("server:presence-manager", "default", "remove", "uid:", userId, "sid:", session.sessionId);

      const presence = this.presences.get(userId);

      if (!presence) {
         return;
      }

      const newActiveSessions = presence.activeSessions.filter((x) => x !== session.sessionId);
      const newStatus = newActiveSessions.length === 0 ? "offline" : presence.status;

      // Only send the user presence to others if it's not already set to offline. This is to keep a user who set their status to offline be no different than an actual offline user
      if (presence.status !== "offline") {
         log("server:presence-manager", "send", "presence_update", "uid:", userId, "nsts:", newStatus);
         dispatchToTopic(`${userId}_presence`, "presence_update", {
            user: { id: userId },
            status: newStatus,
            activeSessions: newActiveSessions,
         });
      }

      // it's length being 0 means it's the only session. So we can easily remove it
      if (newActiveSessions.length === 0) {
         this.presences.delete(userId);
      }
      // Otherwise update the active sessions
      else {
         this.presences.set(userId, { ...presence, activeSessions: newActiveSessions });
      }

      log("server:presence-manager", "detail", "active sessions", "uid:", userId, this.presences.get(userId)?.activeSessions.join(", "));
   }

   public getUserPresences(session: ClientSession) {
      const subscriptions = session.getSubscriptions();

      const presences: UserPresence[] = [];
      for (const [id, presence] of this.presences) {
         if (subscriptions.has(`${id}_presence`)) {
            presences.push(this.convertToGatewayPresence(presence, { id: presence.userId }));
         }
      }

      return presences;
   }

   public getSessionPresence(userId: Snowflake) {
      return this.presences.get(userId);
   }

   public sendToUser(whomToSendId: Snowflake, targetId: Snowflake, offlineStatus?: boolean) {
      const presence: ServerUserPresence | undefined = offlineStatus
         ? { userId: targetId, status: "offline", activeSessions: [] }
         : this.presences.get(targetId);
      if (presence) {
         log("server:presence-manager", "send", "to user", "wid:", whomToSendId, "tid:", targetId, "osts:", offlineStatus);
         dispatchToTopic(whomToSendId, "presence_update", this.convertToGatewayPresence(presence, { id: targetId }));
      }
   }

   public convertToGatewayPresence(presence: ServerUserPresence, user: PresenceUser): UserPresence {
      return { ...omit(presence, ["userId"]), user: pick(user, ["id", "avatar", "displayName", "flags", "username"]) };
   }
}
