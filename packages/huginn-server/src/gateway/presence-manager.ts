import { type PresenceUser, type Snowflake, type UserPresence, type UserSettings, pick } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";
import type { ClientSession } from "./client-session";

export class PresenceManager {
	private presences: Map<Snowflake, UserPresence>;

	public constructor() {
		this.presences = new Map();
	}

	public setUserPresence(user: PresenceUser, session: ClientSession, settings: UserSettings) {
		const presence: UserPresence = {
			user: { id: user.id },
			status: settings.status,
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

	public removeUserPresence(userId: Snowflake) {
		dispatchToTopic(`${userId}_presence`, "presence_update", { user: { id: userId }, status: "offline" });
		this.presences.delete(userId);
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

	public sendToUser(senderId: Snowflake, recieverId: Snowflake, offlineStatus?: boolean) {
		const presence: UserPresence | undefined = offlineStatus ? { user: { id: recieverId }, status: "offline" } : this.presences.get(recieverId);
		if (presence) {
			dispatchToTopic(senderId, "presence_update", presence);
		}
	}
}
