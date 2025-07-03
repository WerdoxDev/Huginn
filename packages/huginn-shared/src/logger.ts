type LogValuesMap = {
   "api:voice": "send" | "recv" | "heartbeat" | "ping" | "default" | "local-voice-state";
   "api:gateway": "send" | "send-detail" | "default" | "recv" | "recv-detail" | "dispatch" | "heartbeat";
   "api:client": "ready-state";
   "app:api-client": "default";
   "app:voice-client": "default" | "voice-recv" | "emitter-recv" | "settings-sub";
   "app:voice-store": "remote-sources" | "speaking-state" | "voice-preferences" | "voice-state" | "call-state" | "default" | "gateway-recv" | "voice-recv";
   "app:audio-source-player": "default";
   "app:audio-level-checker": "default";
   "app:voice-input-device": "default";
   "app:electron": "default" | "send" | "recv" | "updater" | "loopback-send" | "loopback";
   "server:gateway": "default" | "send" | "recv" | "heartbeat";
   "voice:websocket": "default" | "recv";
   // "server:client-session": "default"|"subscriptions"|"heartbeat";
   "shared:websocket": "default" | "subscriptions";
   "shared:client-session": "default" | "subscriptions" | "heartbeat";
};

// type Logs = typeof logs;
type LogKeys = keyof LogValuesMap;
type LogValuesFor<K extends LogKeys> = LogValuesMap[K];

const enabledSections = new Map<LogKeys, Set<LogValuesMap[LogKeys]>>();
// const enabledSections = new Set<string>();
// const enabledLevels = new Set<string>();

export function enableLogs<T extends Partial<{ [K in LogKeys]: LogValuesMap[K][] }>>(sections: T): void {
   for (const [section, levels] of Object.entries(sections) as [LogKeys, string[]][]) {
      if (enabledSections.has(section)) {
         const existing = enabledSections.get(section);
         for (const level of levels) {
            existing?.add(level as LogValuesFor<typeof section>);
         }
      } else {
         enabledSections.set(section, new Set(levels as LogValuesFor<typeof section>[]));
      }
   }
}

export function disableLogs<K extends LogKeys>(sections: Record<K, LogValuesFor<K>[]>): void {
   for (const entry of Object.entries(sections)) {
      const section = entry[0] as LogKeys;
      const levels = entry[1] as LogValuesFor<K>[];

      if (!enabledSections.has(section)) {
         return;
      }

      const existingSection = enabledSections.get(section);
      for (const level of levels) {
         existingSection?.delete(level);
      }

      if (existingSection?.size === 0) {
         enabledSections.delete(section);
      }
   }
}

const levelStyles: Partial<Record<LogValuesFor<LogKeys> | "default", string>> = {
   default: 'color: green',
   // debug: 'color: white; background: #666; padding: 1px 6px; border-radius: 4px;',
   // warn: 'color: black; background: #FFC107; padding: 1px 6px; border-radius: 4px;',
};

const sectionStyles: Partial<Record<LogKeys | "default" | "error", string>> = {
   default: 'color: black; background: white; padding: 1px 6px; border-radius: 4px;',
   error: 'color: white; background: #DC3545; padding: 1px 6px; border-radius: 4px;',
   "api:gateway": 'color: white; background: #007BFF; padding: 1px 6px; border-radius: 4px;',
   "api:voice": 'color: white; background: #029687; padding: 1px 6px; border-radius: 4px;',
}

// biome-ignore lint/suspicious/noExplicitAny: any is used to be compliant with console.log
export function log<K extends LogKeys>(section: K, level: LogValuesFor<K>, ...args: any[]): void {
   const existingSections = enabledSections.get(section);
   if (!existingSections || !existingSections.has(level)) {
      return;
   }

   const sectionStyle = sectionStyles[section] ?? sectionStyles.default;
   const levelStyle = levelStyles[level] ?? levelStyles.default;

   const formatString = `%c${section}%c [${level}]`;
   const stylesString = [sectionStyle, levelStyle];

   console.log(formatString, ...stylesString, ...args);
}

// biome-ignore lint/suspicious/noExplicitAny: any is used to be compliant with console.log
export function error(section: LogKeys, ...args: any[]): void {
   const levelStyle = levelStyles.default;
   const sectionStyle = sectionStyles[section] ?? sectionStyles.error;

   const formatString = `%c${section}%c [error]`;

   console.error(formatString, sectionStyle, levelStyle, ...args)
}
