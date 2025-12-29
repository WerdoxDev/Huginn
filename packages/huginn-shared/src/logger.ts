export const LOG_VALUES_MAP = {
   "api:voice": ["default"],
   "api:voice-signaling": ["default", "recv", "recv-detail", "send", "send-detail", "ping", "heartbeat"],
   "api:voice-transport": ["default", "voice-state"],
   "api:voice-device": ["default"],
   "api:voice-stream": ["default"],
   "api:gateway": ["send", "send-detail", "default", "recv", "recv-detail", "dispatch", "heartbeat"],
   "api:gateway-voice": ["default"],
   "api:voice-manager": ["default"],
   "api:client": ["ready-state"],
   "app:client-store": ["default"],
   "app:voice-bridge": ["default", "voice-preference"],
   "app:voice-store": [
      "remote-sources",
      "speaking-state",
      "voice-state",
      "call-state",
      "default",
      "gateway-recv",
      "voice-recv",
      "available-producers",
   ],
   "app:general": ["messages"],
   "app:presence-store": ["default"],
   "app:audio-source-player": ["default"],
   "app:audio-level-checker": ["default"],
   "app:voice-input-device": ["default"],
   "app:electron": ["default", "send", "recv", "updater", "loopback-send", "loopback", "file-controller"],
   "server:gateway": ["default", "send", "recv", "heartbeat", "detail-identify"],
   "server:presence-manager": ["default", "send", "detail"],
   "voice:websocket": ["default", "recv"],
   "shared:websocket": ["default", "subscriptions"],
   "shared:client-session": ["default", "subscriptions", "heartbeat"],
   "backend-shared:route-utils": ["default"],
   "app:hooks": ["voice-utils"],
} as const;

// Derive the type from the const
type LogValuesMap = {
   [K in keyof typeof LOG_VALUES_MAP]: (typeof LOG_VALUES_MAP)[K][number];
};

type LogKeys = keyof LogValuesMap;
type LogValuesFor<K extends LogKeys> = LogValuesMap[K];
export type LogArgs = string | number | boolean | null | undefined | unknown;

const levelStyles: Partial<Record<LogValuesFor<LogKeys> | "default", string>> = {
   default: "color: green",
   // debug: 'color: white; background: #666; padding: 1px 6px; border-radius: 4px;',
   // warn: 'color: black; background: #FFC107; padding: 1px 6px; border-radius: 4px;',
};

const sectionStyles: Partial<Record<LogKeys | "default" | "error", string>> = {
   default: "color: black; background: white; padding: 1px 6px; border-radius: 4px;",
   error: "color: white; background: #DC3545; padding: 1px 6px; border-radius: 4px;",
   "api:gateway": "color: white; background: #007BFF; padding: 1px 6px; border-radius: 4px;",
   "api:voice": "color: white; background: #029687; padding: 1px 6px; border-radius: 4px;",
};

export function log<K extends LogKeys>(section: K, level: LogValuesFor<K>, ...args: LogArgs[]): void {
   logger.log(section, level, ...args);
}

export function error(section: LogKeys, ...args: LogArgs[]): void {
   logger.error(section, ...args);
}

export class Logger {
   private enabledLogs = new Map<LogKeys, Set<LogValuesMap[LogKeys]>>();
   private excludedEventLogs = new Map<LogKeys, Set<LogValuesMap[LogKeys]>>();
   private isRaw = false;

   private onLog: ((section: string, level: string, ...args: LogArgs[]) => void) | undefined;
   private onError: ((section: string, ...args: LogArgs[]) => void) | undefined;

   public enableLogs<T extends Partial<{ [K in LogKeys]: LogValuesMap[K][] }>>(sections: T): void {
      for (const [section, levels] of Object.entries(sections) as [LogKeys, string[]][]) {
         if (this.enabledLogs.has(section)) {
            const existing = this.enabledLogs.get(section);
            for (const level of levels) {
               existing?.add(level as LogValuesFor<typeof section>);
            }
         } else {
            this.enabledLogs.set(section, new Set(levels as LogValuesFor<typeof section>[]));
         }
      }
   }

   public disableLogs<K extends LogKeys>(sections: Record<K, LogValuesFor<K>[]>): void {
      for (const entry of Object.entries(sections)) {
         const section = entry[0] as LogKeys;
         const levels = entry[1] as LogValuesFor<K>[];

         if (!this.enabledLogs.has(section)) {
            return;
         }

         const existingSection = this.enabledLogs.get(section);
         for (const level of levels) {
            existingSection?.delete(level);
         }

         if (existingSection?.size === 0) {
            this.enabledLogs.delete(section);
         }
      }
   }

   public excludeEventLogs<T extends Partial<{ [K in LogKeys]: LogValuesMap[K][] }>>(sections: T): void {
      for (const [section, levels] of Object.entries(sections) as [LogKeys, string[]][]) {
         if (this.excludedEventLogs.has(section)) {
            const existing = this.excludedEventLogs.get(section);
            for (const level of levels) {
               existing?.add(level as LogValuesFor<typeof section>);
            }
         } else {
            this.excludedEventLogs.set(section, new Set(levels as LogValuesFor<typeof section>[]));
         }
      }
   }

   public setIsRaw(isRaw: boolean): void {
      this.isRaw = isRaw;
   }

   public setOnLog(func: typeof this.onLog): void {
      this.onLog = func;
   }

   public setOnError(func: typeof this.onError): void {
      this.onError = func;
   }

   public log<K extends LogKeys>(section: K, level: LogValuesFor<K>, ...args: LogArgs[]): void {
      const excludedSections = this.excludedEventLogs.get(section);
      if (!excludedSections || !excludedSections.has(level)) {
         this.onLog?.(section, level, ...args);
      }

      const existingSections = this.enabledLogs.get(section);
      if (!existingSections || !existingSections.has(level)) {
         return;
      }

      const sectionStyle = sectionStyles[section] ?? sectionStyles.default;
      const levelStyle = levelStyles[level] ?? levelStyles.default;

      const formatString = `%c${section}%c [${level}]`;
      const stylesString = [sectionStyle, levelStyle];

      if (this.isRaw) {
         console.log(section, level, ...args);
      } else {
         console.log(formatString, ...stylesString, ...args);
      }
   }

   public error(section: LogKeys, ...args: LogArgs[]): void {
      this.onError?.(section, ...args);

      const levelStyle = levelStyles.default;
      const sectionStyle = sectionStyles[section] ?? sectionStyles.error;

      const formatString = `%c${section}%c [error]`;

      if (this.isRaw) {
         console.error(section, ...args);
      } else {
         console.error(formatString, sectionStyle, levelStyle, ...args);
      }
   }
}

export const logger: Logger = new Logger();
