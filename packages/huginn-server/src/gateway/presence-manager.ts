import type { ServerUserPresence } from "@huginn/backend-shared";

import {
   type ActivityWithoutSessionId,
   type PresenceStatus,
   type PresenceUser,
   type Snowflake,
   type UserPresence,
   type UserSettings,
   analytics,
   log,
   omit,
   pick,
   recordSpanError,
} from "@huginn/shared";

import { presenceLogger } from "#loggers";
import { dispatchToTopic } from "#utils/gateway-utils";

import type { ClientSession } from "./client-session";

export class PresenceManager {
   private presences: Map<Snowflake, ServerUserPresence>;

   public constructor() {
      this.presences = new Map();
   }

   public setUserPresence(userId: Snowflake, session: ClientSession, settings: UserSettings) {
      return analytics.startActiveSpan("presenceManager.setUserPresence", (span) => {
         try {
            const existingPresence = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": session.sessionId,
               "params.settings.status": settings.status,
               "params.settings.pinned_channels.count": settings.pinnedChannels?.length ?? "null",
               "presence.has_existing": !!existingPresence,
               "presence.user.id": existingPresence?.userId ?? "null",
            });

            const presence: ServerUserPresence = {
               userId: userId,
               status: existingPresence?.status ?? settings.status,
               activities: existingPresence?.activities ?? [],
               activeSessions: [...(existingPresence?.activeSessions ?? []).filter((x) => x.sessionId !== session.sessionId), { sessionId: session.sessionId }],
            };

            span.setAttributes({
               "presence.active_sessions.count": presence.activeSessions.length,
               "presence.activities.count": presence.activities.length,
            });

            this.presences.set(userId, presence);

            if (presence.status !== "offline") {
               this.sendPresenceUpdate(`${userId}_presence`, presence, { id: userId });
            }

            this.sendSessionUpdate(userId, presence);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public updateUserPresence(
      userId: Snowflake,
      session?: ClientSession,
      user?: PresenceUser,
      status?: PresenceStatus,
      activities?: ActivityWithoutSessionId[],
   ) {
      return analytics.startActiveSpan("presenceManager.updateUserPresence", (span) => {
         try {
            const existingPresence = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": session?.sessionId ?? "null",
               "params.status": status ?? "null",
               "params.activities.count": activities?.length ?? "null",
               "presence.has_existing": !!existingPresence,
               "presence.has_user": !!user,
            });

            if (activities && !session) {
               throw new Error("A new activity was provided but no session");
            }

            if (existingPresence) {
               let finalActivities = existingPresence.activities;

               // If activities are provided, merge them with existing activities from other sessions
               if (activities && session) {
                  // Remove all activities from the current session
                  const otherSessionActivities = existingPresence.activities.filter((activity) => activity.sessionId !== session.sessionId);

                  // Add the new activities with the session ID
                  const newSessionActivities = activities.map((activity) => ({
                     ...activity,
                     sessionId: session.sessionId,
                  }));

                  finalActivities = [...otherSessionActivities, ...newSessionActivities];

                  presenceLogger.info(
                     { userId, sessionId: session.sessionId, otherCount: otherSessionActivities.length, newCount: newSessionActivities.length },
                     "merged activities",
                  );
               }

               const newPresence: ServerUserPresence = {
                  ...existingPresence,
                  userId: userId,
                  status: status ?? existingPresence.status,
                  activities: finalActivities,
               };

               span.setAttributes({
                  "presence.final_status": newPresence.status,
                  "presence.final_activities.count": newPresence.activities.length,
               });

               this.presences.set(userId, newPresence);
               this.sendPresenceUpdate(`${userId}_presence`, newPresence, user ?? { id: userId });
               this.sendSessionUpdate(userId, newPresence);
            } else {
               presenceLogger.info({ userId }, "update skipped - no existing presence");
               span.setAttributes({ "presence.update_skipped": true });
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public removeUserPresence(userId: Snowflake, session: ClientSession) {
      return analytics.startActiveSpan("presenceManager.removeUserPresence", (span) => {
         try {
            const presence = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": session.sessionId,
               "presence.has_existing": !!presence,
               "presence.current_status": presence?.status ?? "null",
               "presence.active_sessions.count": presence?.activeSessions.length ?? "null",
               "presence.activities.count": presence?.activities.length ?? "null",
            });

            if (!presence) {
               span.setAttributes({ "presence.remove_skipped": true });
               return;
            }

            const newActiveSessions = presence.activeSessions.filter((x) => x.sessionId !== session.sessionId);
            const newActivities = presence.activities.filter((x) => x.sessionId !== session.sessionId);
            const newStatus = newActiveSessions.length === 0 ? "offline" : presence.status;

            span.setAttributes({
               "presence.new_status": newStatus,
               "presence.remaining_sessions.count": newActiveSessions.length,
               "presence.remaining_activities.count": newActivities.length,
               "presence.was_offline": presence.status === "offline",
            });

            // Only send the user presence to others if it's not already set to offline. This is to keep a user who set their status to offline to be no different than an actual offline user
            if (presence.status !== "offline") {
               const newPresence: ServerUserPresence = {
                  userId,
                  status: newStatus,
                  activeSessions: newActiveSessions,
                  activities: newActivities,
               };
               this.sendPresenceUpdate(`${userId}_presence`, newPresence, { id: userId });
            }

            // it's length being 0 means it's the only session. So we can easily remove it
            if (newActiveSessions.length === 0) {
               this.presences.delete(userId);
               presenceLogger.info({ userId }, "presence deleted (last session)");
               span.setAttributes({ "presence.deleted": true });
            }
            // Otherwise update the active sessions
            else {
               const newPresence: ServerUserPresence = {
                  ...presence,
                  activeSessions: newActiveSessions,
                  activities: newActivities,
               };
               this.presences.set(userId, newPresence);
               this.sendSessionUpdate(userId, newPresence);
               span.setAttributes({ "presence.deleted": false });
            }

            presenceLogger.debug(
               {
                  userId,
                  sessionId: session.sessionId,
                  sessions: this.presences
                     .get(userId)
                     ?.activeSessions.map((s) => s.sessionId)
                     .join(", "),
               },
               "active sessions",
            );
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getUserPresences(session: ClientSession) {
      return analytics.startActiveSpan("presenceManager.getUserPresences", (span) => {
         try {
            const subscriptions = session.getSubscriptions();

            span.setAttributes({
               "params.session.id": session.sessionId,
               "presence.total_tracked": this.presences.size,
               "presence.subscriptions.count": subscriptions.size,
            });

            const presences: UserPresence[] = [];
            for (const [id, presence] of this.presences) {
               if (subscriptions.has(`${id}_presence`)) {
                  presences.push(this.convertToGatewayPresence(presence, { id: presence.userId }));
               }
            }

            span.setAttributes({ "presence.returned.count": presences.length });

            return presences;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public getSessionPresence(userId: Snowflake) {
      return analytics.startActiveSpan("presenceManager.getSessionPresence", (span) => {
         try {
            const presence = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "presence.found": !!presence,
               "presence.status": presence?.status ?? "null",
               "presence.active_sessions.count": presence?.activeSessions.length ?? "null",
            });

            return presence;
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public sendToUser(whomToSendId: Snowflake, userId: Snowflake, offlineStatus?: boolean) {
      return analytics.startActiveSpan("presenceManager.sendToUser", (span) => {
         try {
            span.setAttributes({
               "params.recipient.id": whomToSendId,
               "params.user.id": userId,
               "params.offline_status": offlineStatus ?? false,
            });

            const presence: ServerUserPresence | undefined = offlineStatus
               ? { userId: userId, status: "offline", activeSessions: [], activities: [] }
               : this.presences.get(userId);

            span.setAttributes({ "presence.found": !!presence });

            if (presence) {
               this.sendPresenceUpdate(whomToSendId, presence, { id: userId });
            } else {
               presenceLogger.info({ userId, whomToSendId }, "sendToUser skipped - no presence found");
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public convertToGatewayPresence(presence: ServerUserPresence, user: PresenceUser): UserPresence {
      return {
         ...omit(presence, ["userId"]),
         user: pick(user, ["id", "avatar", "displayName", "flags", "username", "bannerColor", "accentColor", "banner", "bio"]),
      };
   }

   private sendPresenceUpdate(topic: string, presence: ServerUserPresence, user: PresenceUser) {
      presenceLogger.info({ userId: user.id, topic }, "sendPresenceUpdate");
      dispatchToTopic(topic, "presence_update", this.convertToGatewayPresence(presence, user));
   }

   private sendSessionUpdate(userId: Snowflake, presence: ServerUserPresence) {
      presenceLogger.info({ userId, status: presence.status }, "sendSessionUpdate");
      dispatchToTopic(userId, "session_update", {
         status: presence.status,
         activities: presence.activities,
         activeSessions: presence.activeSessions,
      });
   }
}
