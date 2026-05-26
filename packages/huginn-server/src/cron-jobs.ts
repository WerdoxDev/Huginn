import { prisma } from "@huginn/backend-shared/database/index";
import { ChannelType, log } from "@huginn/shared";

export async function startCronJobs() {
   log("server:cron", "default", "scheduling cron jobs");

   await removeEmptyChannels();
   Bun.cron("@hourly", async () => await removeExpiredEmailVerifications());
}

async function removeExpiredEmailVerifications() {
   log("server:cron", "default", "delete expired email verifications");

   const result = await prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });

   log("server:cron", "default", "finished deleting expired email verifications, c:", result.count);
}

async function removeEmptyChannels() {
   log("server:cron", "default", "delete empty channels");

   const result = await prisma.channel.deleteMany({ where: { type: ChannelType.DM, recipients: { none: {} } } });

   log("server:cron", "default", "finished deleting empty channels, c:", result.count);
}
