import {
   type Activity,
   type PresenceStatus,
   type PresenceUser,
   type Snowflake,
   type UserPresence,
   type UserSettings,
   log,
   omit,
   pick,
} from "@huginn/shared";
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
         activities: [],
         activeSessions: [...(existingPresence?.activeSessions ?? []).filter((x) => x !== session.sessionId), session.sessionId],
      };

      log("server:presence-manager", "detail", "active sessions", "uid:", userId, presence.activeSessions.join(", "));

      this.presences.set(userId, presence);

      if (presence.status !== "offline") {
         this.sendPresenceUpdate(`${userId}_presence`, presence, { id: userId });
      }

      this.sendSessionUpdate(userId, presence);
   }

   public updateUserPresence(userId: Snowflake, user?: PresenceUser, status?: PresenceStatus, activities?: Activity[]) {
      log("server:presence-manager", "default", "update", "uid:", userId);

      const existingPresence = this.presences.get(userId);
      if (existingPresence) {
         const newPresence: ServerUserPresence = {
            ...existingPresence,
            userId: userId,
            status: status ?? existingPresence.status,
            activities: activities ? activities : existingPresence.activities,
         };
         this.presences.set(userId, newPresence);

         this.sendPresenceUpdate(`${userId}_presence`, newPresence, user ?? { id: userId });
         this.sendSessionUpdate(userId, newPresence);
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

      // Only send the user presence to others if it's not already set to offline. This is to keep a user who set their status to offline to be no different than an actual offline user
      if (presence.status !== "offline") {
         const newPresence: ServerUserPresence = { userId, status: newStatus, activeSessions: newActiveSessions, activities: [] };
         this.sendPresenceUpdate(`${userId}_presence`, newPresence, { id: userId });
      }

      // it's length being 0 means it's the only session. So we can easily remove it
      if (newActiveSessions.length === 0) {
         this.presences.delete(userId);
      }
      // Otherwise update the active sessions
      else {
         const newPresence: ServerUserPresence = { ...presence, activeSessions: newActiveSessions };
         this.presences.set(userId, newPresence);
         this.sendSessionUpdate(userId, newPresence);
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
         ? { userId: targetId, status: "offline", activeSessions: [], activities: [] }
         : this.presences.get(targetId);
      if (presence) {
         this.sendPresenceUpdate(whomToSendId, presence, { id: targetId });
      }
   }

   public convertToGatewayPresence(presence: ServerUserPresence, user: PresenceUser): UserPresence {
      return { ...omit(presence, ["userId"]), user: pick(user, ["id", "avatar", "displayName", "flags", "username"]) };
   }

   private sendPresenceUpdate(topic: string, presence: ServerUserPresence, user: PresenceUser) {
      log("server:presence-manager", "send", "presence_update", "to:", topic, "uid:", user.id, "sts:", presence.status);
      dispatchToTopic(topic, "presence_update", this.convertToGatewayPresence(presence, user));
   }

   private sendSessionUpdate(userId: Snowflake, presence: ServerUserPresence) {
      log("server:presence-manager", "send", "session_update", "uid:", userId, "sts:", presence.status);
      dispatchToTopic(userId, "session_update", {
         status: presence.status,
         activities: presence.activities,
         activeSessions: presence.activeSessions,
      });
   }
}
