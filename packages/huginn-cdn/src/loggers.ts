import { logger, type Logger } from "@huginn/backend-shared/logger";

export const storageLogger: Logger = logger.child({ module: "storage" }, { msgPrefix: "[STORAGE] " });
