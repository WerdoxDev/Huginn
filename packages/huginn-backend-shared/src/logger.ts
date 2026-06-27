import type { Logger, pino as selfPino } from "pino";

const isBun = typeof Bun !== "undefined";

let pino: typeof selfPino;

if (isBun) {
   pino = require("pino");
} else {
   pino = (await import("pino")).pino;
}

// const pino = require("pino");
const logger: Logger = pino({ level: process.env.LOG_LEVEL || "info", transport: { target: "pino-pretty" } });

export { logger, type Logger };
