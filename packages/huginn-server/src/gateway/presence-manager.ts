import type {
	APIRelationshipWithoutOwner,
	APIUser,
	GatewayPresenceUpdateData,
	PresenceStatus,
	Snowflake,
	UserPresence,
	UserSettings,
} from "@huginn/shared";
import { preprocess } from "zod";
import { dispatchToTopic } from "#utils/gateway-utils";
import type { ClientSession } from "./client-session";

export class PresenceManager {
	private presences: Map<Snowflake, UserPresence>;

	public constructor() {
		this.presences = new Map();
	}

	public setClient(user: Partial<APIUser> & { id: Snowflake }, session: ClientSession, settings: UserSettings) {
		const isOfficialClient = session.data.browser === "Huginn Client";
		const presence: UserPresence = {
			user,
			status: settings.status,
			clientStatus: { desktop: isOfficialClient ? settings.status : undefined, web: !isOfficialClient ? settings.status : undefined },
		};

		const existing = this.presences.get(user.id);

		this.presences.set(user.id, existing ? { ...presence, clientStatus: { ...existing.clientStatus, ...presence.clientStatus } } : presence);

		dispatchToTopic(`${user.id}_presence`, "presence_update", presence);
	}

	public removeClient(userId: Snowflake) {
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

	public getClient(userId: Snowflake) {
		return this.presences.get(userId);
	}

	public sendToUser(userId: Snowflake, userIdToSend: Snowflake, offlineStatus?: boolean) {
		const presence: UserPresence | undefined = offlineStatus ? { user: { id: userIdToSend }, status: "offline" } : this.presences.get(userIdToSend);
		if (presence) {
			dispatchToTopic(userId, "presence_update", presence);
		}
	}
}
