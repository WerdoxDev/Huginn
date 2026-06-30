import crossws from "crossws/adapters/bun";

import { gateway } from "#server";

const ws = crossws({
   hooks: {
      open: gateway._internalOnOpen.bind(gateway),
      close: gateway._internalOnClose.bind(gateway),
      message: gateway._internalOnMessage.bind(gateway),
   },
});

export { ws };
