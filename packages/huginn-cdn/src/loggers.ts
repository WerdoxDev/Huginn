import { logger } from "@huginn/backend-shared/logger";

export const storageLogger = logger.child({ module: "storage" }, { msgPrefix: "[STORAGE] " });
