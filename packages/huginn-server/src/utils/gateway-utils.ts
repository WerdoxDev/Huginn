import { logGatewaySend } from "@huginn/backend-shared";
import { type BasePayload, type GatewayEvents, GatewayOperations } from "@huginn/shared";
import { gateway } from "../server";

export function dispatchToTopic<K extends keyof GatewayEvents>(topics: string | string[], t: K, d: GatewayEvents[K]) {
	const data = { op: GatewayOperations.DISPATCH, t, d, s: 0 };

	logGatewaySend(topics, data, false);

	if (Array.isArray(topics)) {
		for (const topic of topics) {
			gateway.sendToTopic(topic, data);
		}
	} else {
		gateway.sendToTopic(topics, data);
	}
}

export function validateGatewayData(data: unknown): boolean {
	if (data && typeof data === "object") {
		return "op" in data;
	}

	return false;
}
