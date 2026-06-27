import { logger, type Logger } from "@huginn/backend-shared/logger";

export const cronLogger: Logger = logger.child({ module: "cron" }, { msgPrefix: "[CRON] " });
export const presenceLogger: Logger = logger.child({ module: "presence" }, { msgPrefix: "[PRESENCE] " });
export const voiceLogger: Logger = logger.child({ module: "voice" }, { msgPrefix: "[VOICE] " });
