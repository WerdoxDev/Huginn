import { gateway } from "#setup";

export default defineEventHandler({
	handler() {
		throw createError({
			statusCode: 426,
			statusMessage: "Upgrade Required",
		});
	},
	websocket: {
		close: gateway.close.bind(gateway),
		message: gateway.message.bind(gateway),
		open: gateway.open.bind(gateway),
	},
});
