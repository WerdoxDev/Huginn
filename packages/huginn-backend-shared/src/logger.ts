// import pino from "pino";

import type { Logger } from "pino";

const pino = require("pino");
const logger: Logger = pino({ level: process.env.LOG_LEVEL || "info", transport: { target: "pino-pretty" } });

export { logger, type Logger };
