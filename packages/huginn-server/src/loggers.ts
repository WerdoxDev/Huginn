import { logger } from "@huginn/backend-shared/logger";

export const cronLogger = logger.child({ module: "cron" }, { msgPrefix: "[CRON] " });
export const presenceLogger = logger.child({ module: "presence" }, { msgPrefix: "[PRESENCE] " });
export const voiceLogger = logger.child({ module: "voice" }, { msgPrefix: "[VOICE] " });
