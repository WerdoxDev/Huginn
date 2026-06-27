import { prisma } from "@huginn/backend-shared/database";
import { ChannelType } from "@huginn/shared";

import { cronLogger } from "./loggers";

export async function startCronJobs() {
   cronLogger.info("scheduling cron jobs");

   await removeEmptyChannels();
   Bun.cron("@hourly", async () => await removeExpiredEmailVerifications());
}

async function removeExpiredEmailVerifications() {
   cronLogger.info("delete expired email verifications");

   const result = await prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });

   cronLogger.info({ count: result.count }, "finished deleting expired email verifications");
}

async function removeEmptyChannels() {
   cronLogger.info("delete empty channels");

   const result = await prisma.channel.deleteMany({ where: { type: ChannelType.DM, recipients: { none: {} } } });

   cronLogger.info({ count: result.count }, "finished deleting empty channels");
}
