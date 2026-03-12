import { error, type LogArgs, type Logger } from "@huginn/shared";

type LogEntry = {
   type: "log" | "error";
   timestamp: string;
   section: string;
   level?: string;
   args: LogArgs[];
};
type SystemInfo = {
   platform: string;
   arch: string;
   version: string;
   appVersion: string;
   release: string;
};

export class RemoteLogger {
   private logger: Logger;
   private endpoint: string;
   private clientId: string;
   private systemInfo?: SystemInfo;
   private logBuffer: Array<LogEntry>;
   private maxBufferSize = 100;
   private flushInterval = 10000;

   constructor(logger: Logger, endpoint: string, clientId: string) {
      this.logger = logger;
      this.endpoint = endpoint;
      this.clientId = clientId;

      this.logBuffer = [];

      this.logger.on("log", ({ section, level, args }) => this.addToBuffer("log", section, level, ...args));
      this.logger.on("error", ({ section, args }) => this.addToBuffer("error", section, undefined, ...args));

      setInterval(() => this.flush(), this.flushInterval);

      if (typeof window === "undefined") {
         this.setSystemInfo();
      }
   }

   public addToBuffer(type: LogEntry["type"], section: string, level: string | undefined, ...args: LogArgs[]) {
      const entry: LogEntry = {
         type,
         section,
         level,
         args,
         timestamp: new Date().toISOString(),
      };

      this.logBuffer.push(entry);

      this.checkMaxLogBuffer();
   }

   private checkMaxLogBuffer() {
      if (this.logBuffer.length >= this.maxBufferSize) {
         this.flush();
      }
   }

   public async flush() {
      if (this.logBuffer.length === 0) {
         return;
      }

      const logsToSend = [...this.logBuffer];
      this.logBuffer = [];

      try {
         const body = {
            clientId: this.clientId,
            systemInfo: this.systemInfo,
            logs: logsToSend,
            timestamp: new Date().toISOString(),
         };
         await fetch(this.endpoint, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
         });
      } catch (e) {
         error("app:general", "Remote logger failed to send logs:", e);
         this.logBuffer.unshift(...logsToSend);
      }
   }

   private async setSystemInfo() {
      const os = await import("node:os");
      const app = (await import("electron")).app;
      this.systemInfo = {
         platform: os.platform(),
         arch: os.arch(),
         release: os.release(),
         version: os.version(),
         appVersion: app.getVersion(),
      };
   }
}
