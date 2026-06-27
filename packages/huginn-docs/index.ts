import "./otel";

const { pino } = await import("pino");

const logger = pino();

setTimeout(() => {
   logger.info("Huginn Docs is running...");
}, 1000);

setTimeout(() => {
   process.exit(0);
}, 10000);
