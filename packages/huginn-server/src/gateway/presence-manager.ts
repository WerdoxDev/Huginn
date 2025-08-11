import { type PresenceUser, type Snowflake, type UserPresence, type UserSettings, pick } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import type { ClientSession } from "./client-session";

export class PresenceManager {
   private presences: Map<Snowflake, UserPresence>;

   public constructor() {
      this.presences = new Map();
   }

   public setUserPresence(user: PresenceUser, session: ClientSession, settings: UserSettings) {
      const existingPresence = this.presences.get(user.id);

      const presence: UserPresence = {
         user: { id: user.id },
         status: existingPresence?.status ?? settings.status,
         activeSessions: [...(existingPresence?.activeSessions ?? []), session.sessionId],
      };

      this.presences.set(user.id, presence);

      dispatchToTopic(`${user.id}_presence`, "presence_update", presence);
   }

   public updateUserPresence(user: PresenceUser) {
      const existingPresence = this.presences.get(user.id);
      if (existingPresence) {
         const newPresence = { ...existingPresence, user: pick(user, ["id", "avatar", "displayName", "flags", "username"]) };
         this.presences.set(user.id, newPresence);
         dispatchToTopic(`${user.id}_presence`, "presence_update", newPresence);
      }
   }

   public removeUserPresence(userId: Snowflake, session: ClientSession) {
      const presence = this.presences.get(userId);

      if (!presence) {
         return;
      }

      const newActiveSessions = presence.activeSessions.filter((x) => x !== session.sessionId);

      dispatchToTopic(`${userId}_presence`, "presence_update", {
         user: { id: userId },
         status: newActiveSessions.length === 0 ? "offline" : presence.status,
         activeSessions: newActiveSessions,
      });

      // it's length being 0 means it's the only session. So we can easily remove it
      if (newActiveSessions.length === 0) {
         this.presences.delete(userId);
      }
      // Otherwise update the active sessions
      else {
         this.presences.set(userId, { ...presence, activeSessions: newActiveSessions });
      }
   }

   public getUserPresences(session: ClientSession) {
      const subscriptions = session.getSubscriptions();

      const presences: UserPresence[] = [];
      for (const [id, presence] of this.presences) {
         if (subscriptions.has(`${id}_presence`)) {
            presences.push(presence);
         }
      }

      return presences;
   }

   public getSessionPresence(userId: Snowflake) {
      return this.presences.get(userId);
   }

   public sendToUser(senderId: Snowflake, receiverId: Snowflake, offlineStatus?: boolean) {
      const presence: UserPresence | undefined = offlineStatus
         ? { user: { id: receiverId }, status: "offline", activeSessions: [] }
         : this.presences.get(receiverId);
      if (presence) {
         dispatchToTopic(senderId, "presence_update", presence);
      }
   }
}
