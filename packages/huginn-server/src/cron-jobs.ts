import { prisma } from "@huginn/backend-shared/database/index";
import { CONSTANTS, log } from "@huginn/shared";

export function startCronJobs() {
   log("server:cron", "default", "starting cron jobs");

   // expired email verifications
   setInterval(async () => {
      log("server:cron", "default", "delete expired email verifications");
   }, CONSTANTS.EMAIL_VERIFICATION_WINDOW);
   setTimeout(async () => {
      console.log("Running initial cleanup of expired email verifications...");
      await new Promise((r) => setImmediate(r));
      const result = await prisma.channel.count({});
      log("server:cron", "default", `deleted ${result.count} expired email verifications`);
   }, 5000);
}
