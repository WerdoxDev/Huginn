import { prisma } from "@huginn/backend-shared/database/index";
import { CONSTANTS, log } from "@huginn/shared";

export function startCronJobs() {
   log("server:cron", "default", "starting cron jobs");

   // expired email verifications
   setInterval(async () => {
      log("server:cron", "default", "delete expired email verifications");
      await prisma.emailVerification.deleteMany({ where: { expiresAt: { lt: new Date() } } });
   }, CONSTANTS.EMAIL_VERIFICATION_WINDOW);
}
