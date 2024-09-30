import type { GatewayPresenceUpdateData, Snowflake } from "@huginn/shared";
import { dispatchToTopic } from "#utils/gateway-utils";

export class PresenceManager {
	private presences: Map<Snowflake, GatewayPresenceUpdateData>;

	public constructor() {
		this.presences = new Map();
	}

	public async addClient(userId: Snowflake) {
		const presence: GatewayPresenceUpdateData = { user: { id: userId }, status: "online" };
		this.presences.set(userId, presence);

		dispatchToTopic([`${userId}_public`, userId], "presence_update", presence);
		this.sendBatchUpdate(userId);
	}

	public async removeClient(userId: Snowflake) {
		dispatchToTopic(`${userId}_public`, "presence_update", { user: { id: userId }, status: "offline" });
		this.presences.delete(userId);
	}

	public async sendBatchUpdate(userId: Snowflake) {
		const presences = Array.from(this.presences)
			.filter((x) => x[0] !== userId)
			.map((x) => x[1]);

		if (presences.length > 0) {
			dispatchToTopic(userId, "batch_presence_update", presences);
		}
	}
}
