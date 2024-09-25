import { type BasePayload, type GatewayEvents, GatewayOperations } from "@huginn/shared";
import { gateway } from "../server";
import { logGatewaySend } from "@huginn/backend-shared";

export function publishToTopic(topic: string, data: BasePayload) {
	logGatewaySend(data, false);

	gateway.sendToTopic(topic, data);
}

export function dispatchToTopic<K extends keyof GatewayEvents>(topic: string, t: K, d: GatewayEvents[K]) {
	publishToTopic(topic, { op: GatewayOperations.DISPATCH, t, d, s: 0 });
}

export function validateGatewayData(data: unknown): boolean {
	if (data && typeof data === "object") {
		return "op" in data;
	}

	return false;
}
