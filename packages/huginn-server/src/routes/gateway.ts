import crossws from "crossws/adapters/bun";
import { gateway } from "#setup";

const ws = crossws({
	hooks: {
		open: gateway.open.bind(gateway),
		close: gateway.close.bind(gateway),
		message: gateway.message.bind(gateway),
	},
});

export { ws };
