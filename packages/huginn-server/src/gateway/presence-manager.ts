import {
   type Activity,
   type ClientStatus,
   type ClientStatusKey,
   type GatewaySession,
   type PresenceStatus,
   type PresenceUser,
   type Snowflake,
   type UserPresence,
   type UserSettings,
   analytics,
   pick,
   recordSpanError,
} from "@huginn/shared";

import { presenceLogger } from "#loggers";
import { dispatchToTopic } from "#utils/gateway-utils";

import type { ClientSession } from "./client-session";

type ClientBrowser = "Huginn Client" | "Huginn Mobile" | "Huginn Web" | (string & {});

const BROWSER_TO_PLATFORM_KEY: Record<ClientBrowser, ClientStatusKey> = {
   "Huginn Client": "desktop",
   "Huginn Mobile": "mobile",
   "Huginn Web": "web",
};

const STATUS_PRIORITY: PresenceStatus[] = ["online", "dnd", "idle", "offline", "invisible"];

// type SessionPresence = {
//    sessionId: Snowflake;
//    platform: string;
//    status: PresenceStatus;
//    activities: Activity[];
// };

type AggregatedPresence = {
   status: PresenceStatus;
   clientStatus: ClientStatus;
   activities: Activity[];
};

const OFFLINE_PRESENCE: AggregatedPresence = { status: "offline", clientStatus: {}, activities: [] };

export class PresenceManager {
   private presences: Map<Snowflake, GatewaySession[]>;

   public constructor() {
      this.presences = new Map();
   }

   public setUserPresence(userId: Snowflake, session: ClientSession, settings: UserSettings) {
      return analytics.startActiveSpan("presenceManager.setUserPresence", (span) => {
         try {
            const existingSessions = this.presences.get(userId) ?? [];

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": session.sessionId,
               "params.settings.status": settings.status,
               "params.settings.pinned_channels.count": settings.pinnedChannels?.length ?? "null",
               "presence.has_existing": existingSessions.length > 0,
               "presence.existing_sessions.count": existingSessions.length,
               ...session?.getDefaultAttributes(),
            });

            const newSessionPresence: GatewaySession = {
               sessionId: session.sessionId,
               clientInfo: {
                  browser: session.properties?.browser || "web",
                  os: session.properties?.os || "unknown",
               },
               status: settings.status,
               activities: [],
            };

            // Replace any existing entry for this exact session (e.g. a reconnect) and add the new one
            const sessions = [...existingSessions.filter((s) => s.sessionId !== session.sessionId), newSessionPresence];

            this.presences.set(userId, sessions);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public updateUserPresence(
      userId: Snowflake,
      options: {
         session?: ClientSession;
         user?: PresenceUser;
         status?: PresenceStatus;
         activities?: Activity[];
         overallStatus?: boolean;
      } = {},
   ) {
      return analytics.startActiveSpan("presenceManager.updateUserPresence", (span) => {
         try {
            const existingSessions = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": options.session?.sessionId ?? "null",
               "params.status": options.status ?? "null",
               "params.activities.count": options.activities?.length ?? "null",
               "presence.has_existing": !!existingSessions,
               "presence.existing_sessions.count": existingSessions?.length ?? "null",
               "presence.has_user": !!options.user,
               ...options.session?.getDefaultAttributes(),
            });

            if (options.activities && !options.session) {
               throw new Error("A new activity was provided but no session");
            }

            if (!existingSessions || existingSessions.length === 0) {
               presenceLogger.info({ userId }, "update skipped - no existing presence");
               span.setAttributes({ "presence.update_skipped": true });
               return;
            }

            let sessions: GatewaySession[];

            if (options.session) {
               const sessionExists = existingSessions.some((s) => s.sessionId === options.session?.sessionId);
               if (!sessionExists) {
                  throw new Error(`Session ${options.session?.sessionId} does not exist for user ${userId}`);
               }

               // activities need session id attached when sending. receiving activities don't need it.
               const activities = options.activities?.map((x) => ({ ...x, sessionId: options.session!.sessionId })) ?? undefined;
               sessions = existingSessions.map((s) => (s.sessionId === options.session?.sessionId ? { ...s, activities: activities ?? s.activities } : s));

               if (!options.overallStatus) {
                  sessions = sessions.map((s) => (s.sessionId === options.session?.sessionId ? { ...s, status: options.status ?? s.status } : s));
               } else {
                  sessions = sessions.map((s) => ({ ...s, status: options.status ?? s.status }));
               }

               presenceLogger.info(
                  { userId, sessionId: options.session?.sessionId, activitiesCount: options.activities?.length ?? 0 },
                  "updated session presence",
               );
            } else {
               sessions = existingSessions.map((s) => ({ ...s, status: options.status ?? s.status }));

               presenceLogger.info({ userId, sessionCount: sessions.length }, "updated all sessions presence");
            }

            const previousAggregate = this.buildAggregatePresence(existingSessions);

            this.presences.set(userId, sessions);

            const aggregate = this.buildAggregatePresence(sessions);

            span.setAttributes({
               "presence.final_status": aggregate.status,
               "presence.final_activities.count": aggregate.activities.length,
            });

            // only send if there is an actual update. This prevents a privacy leak where an invisible session updates activities
            if (JSON.stringify(previousAggregate) !== JSON.stringify(aggregate)) {
               this.sendPresenceUpdate(`${userId}_presence`, aggregate, options.user ?? { id: userId });
            }
            this.sendSessionUpdate(userId, sessions);
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public removeUserPresence(userId: Snowflake, session: ClientSession) {
      return analytics.startActiveSpan("presenceManager.removeUserPresence", (span) => {
         try {
            const sessions = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "params.session.id": session.sessionId,
               "presence.has_existing": !!sessions,
               "presence.existing_sessions.count": sessions?.length ?? "null",
               ...session?.getDefaultAttributes(),
            });

            if (!sessions) {
               span.setAttributes({ "presence.remove_skipped": true });
               return;
            }

            const previousAggregate = this.buildAggregatePresence(sessions);
            const remainingSessions = sessions.filter((s) => s.sessionId !== session.sessionId);

            span.setAttributes({
               "presence.previous_status": previousAggregate.status,
               "presence.remaining_sessions.count": remainingSessions.length,
            });

            // Only send the user presence to others if it wasn't already offline. This keeps a user
            // who set their status to offline no different from an actual offline user.
            if (remainingSessions.length === 0) {
               this.presences.delete(userId);
               presenceLogger.info({ userId }, "presence deleted (last session)");
               span.setAttributes({ "presence.deleted": true });

               if (previousAggregate.status !== "offline" && previousAggregate.status !== "invisible") {
                  this.sendPresenceUpdate(`${userId}_presence`, OFFLINE_PRESENCE, { id: userId });
               }
            } else {
               this.presences.set(userId, remainingSessions);

               const newAggregate = this.buildAggregatePresence(remainingSessions);

               if (previousAggregate.status !== "offline" && previousAggregate.status !== "invisible") {
                  this.sendPresenceUpdate(`${userId}_presence`, newAggregate, { id: userId });
               }

               this.sendSessionUpdate(userId, remainingSessions);
               span.setAttributes({ "presence.deleted": false, "presence.new_status": newAggregate.status });
            }

            presenceLogger.debug(
               {
                  userId,
                  sessionId: session.sessionId,
                  sessions: this.presences
                     .get(userId)
                     ?.map((s) => s.sessionId)
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
               ...session?.getDefaultAttributes(),
            });

            const presences: UserPresence[] = [];
            for (const [id, sessions] of this.presences) {
               if (subscriptions.has(`${id}_presence`)) {
                  const aggregate = this.buildAggregatePresence(sessions);
                  presences.push(this.convertToGatewayPresence(aggregate, { id }));
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

   /** Returns the raw list of sessions currently open for a user (not the aggregated presence). */
   public getUserSessions(userId: Snowflake) {
      return analytics.startActiveSpan("presenceManager.getUserSessions", (span) => {
         try {
            const sessions = this.presences.get(userId);
            const aggregate = sessions ? this.buildAggregatePresence(sessions) : undefined;

            span.setAttributes({
               "params.user.id": userId,
               "presence.found": !!sessions,
               "presence.status": aggregate?.status ?? "null",
               "presence.sessions.count": sessions?.length ?? "null",
            });

            return sessions;
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

            const sessions = offlineStatus ? undefined : this.presences.get(userId);
            const aggregate: AggregatedPresence | undefined = offlineStatus ? OFFLINE_PRESENCE : sessions ? this.buildAggregatePresence(sessions) : undefined;

            span.setAttributes({ "presence.found": !!aggregate });

            if (aggregate) {
               this.sendPresenceUpdate(whomToSendId, aggregate, { id: userId });
            } else {
               presenceLogger.info({ userId, whomToSendId }, "sendToUser skipped - no presence found");
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public sendUserPresenceUpdate(userId: Snowflake) {
      return analytics.startActiveSpan("presenceManager.sendUserPresence", (span) => {
         try {
            const sessions = this.presences.get(userId);
            const aggregate: AggregatedPresence | undefined = sessions ? this.buildAggregatePresence(sessions) : undefined;

            span.setAttributes({
               "params.user.id": userId,
               "presence.found": !!aggregate,
               "presence.sessions.count": sessions?.length ?? "null",
            });

            if (aggregate) {
               this.sendPresenceUpdate(`${userId}_presence`, aggregate, { id: userId });
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public sendUserSessionUpdate(userId: Snowflake) {
      return analytics.startActiveSpan("presenceManager.sendUserSession", (span) => {
         try {
            const sessions = this.presences.get(userId);

            span.setAttributes({
               "params.user.id": userId,
               "presence.sessions.count": sessions?.length ?? "null",
            });

            if (sessions) {
               this.sendSessionUpdate(userId, sessions);
            }
         } catch (e) {
            recordSpanError(e);
            throw e;
         }
      });
   }

   public convertToGatewayPresence(aggregate: AggregatedPresence, user: PresenceUser): UserPresence {
      const finalUser = pick(user, ["id", "avatar", "displayName", "flags", "username", "bannerColor", "accentColor", "banner", "bio"]);

      if (aggregate.status === "offline" || aggregate.status === "invisible") return { ...OFFLINE_PRESENCE, user: finalUser };
      return {
         ...aggregate,
         user: pick(user, ["id", "avatar", "displayName", "flags", "username", "bannerColor", "accentColor", "banner", "bio"]),
      };
   }

   /**
    * Collapses every session a user has open into the single object that actually gets broadcast:
    * merged activities (tagged with the session they came from), a `clientStatus` entry per
    * platform, and one overall `status` resolved via `STATUS_PRIORITY`.
    */
   private buildAggregatePresence(sessions: GatewaySession[]): AggregatedPresence {
      const clientStatus: ClientStatus = {};
      const statuses: PresenceStatus[] = [];
      const activities: Activity[] = [];

      for (const session of sessions) {
         statuses.push(session.status);

         const key = BROWSER_TO_PLATFORM_KEY[session.clientInfo.browser];
         const existing = clientStatus[key];
         if (
            (!existing || this.getStatusPriority(session.status) < this.getStatusPriority(existing)) &&
            session.status !== "invisible" &&
            session.status !== "offline"
         ) {
            clientStatus[key] = session.status;
         }

         if (session.status !== "offline" && session.status !== "invisible") {
            for (const activity of session.activities) {
               activities.push({ ...activity, sessionId: session.sessionId });
            }
         }
      }

      return {
         status: this.getOverallStatus(statuses),
         clientStatus,
         activities,
      };
   }

   private getStatusPriority(status: PresenceStatus): number {
      const index = STATUS_PRIORITY.indexOf(status);
      return index === -1 ? STATUS_PRIORITY.length : index;
   }

   private getOverallStatus(statuses: PresenceStatus[]): PresenceStatus {
      if (statuses.length === 0) {
         return "offline";
      }

      return statuses.reduce((best, current) => (this.getStatusPriority(current) < this.getStatusPriority(best) ? current : best));
   }

   private sendPresenceUpdate(topic: string, aggregate: AggregatedPresence, user: PresenceUser) {
      presenceLogger.info({ userId: user.id, topic }, "sendPresenceUpdate");
      dispatchToTopic(topic, "presence_update", this.convertToGatewayPresence(aggregate, user));
   }

   private sendSessionUpdate(userId: Snowflake, sessions: GatewaySession[]) {
      presenceLogger.info({ userId, sessionCount: sessions.length }, "sendSessionUpdate");
      dispatchToTopic(userId, "session_update", sessions);
   }
}
