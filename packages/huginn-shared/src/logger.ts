type LogSection = "api:voice" | "api:gateway" | "app:voice-client" | "app:voice-store" | "app:audio-source-player" | "app:audio-level-checker" | "app:voice-input-device";

type LogLevel = "none" | "voice:send" | "voice:recv" | "voie:heartbeat" | "voice:ping" |
   "voice:default" | "gateway:send" | "gateway:send-detail" | "gateway:default" | "gateway:recv" |
   "gateway:recv-detail" | "gateway:dispatch" | "gateway:heartbeat" | "voice:local-voice-state" |
   "voice-client:default" | "voice-store:remote-sources" | "voice-store:speaking-state" |
   "voice-store:voice-preferences" | "voice-store:voice-state" | "voice-store:call-state" |
   "voice-store:default" | "voice-store:gateway-recv" | "voice-store:voice-recv" |
   "voice-client:voice-recv" | "voice-client:emitter-recv" | "voice-client:settings-sub" |
   "audio-source-player:default" | "audio-level-checker:default" | "voice-input-device:default"

const enabledSections = new Set<LogSection>();
const enabledLevels = new Set<LogLevel>();

export function enableLogs(sections: LogSection[], levels: LogLevel[]): void {
   for (const section of sections) {
      enabledSections.add(section);
   }
   for (const level of levels) {
      enabledLevels.add(level);
   }
}

export function disableLogs(sections: LogSection[], levels: LogLevel[]): void {
   for (const section of sections) {
      enabledSections.delete(section);
   }
   for (const level of levels) {
      enabledLevels.delete(level);
   }
}

const levelStyles: Partial<Record<LogLevel | "default", string>> = {
   default: 'color: green',
   // debug: 'color: white; background: #666; padding: 1px 6px; border-radius: 4px;',
   // warn: 'color: black; background: #FFC107; padding: 1px 6px; border-radius: 4px;',
};

const sectionStyles: Partial<Record<LogSection | "default" | "error", string>> = {
   default: 'color: black; background: white; padding: 1px 6px; border-radius: 4px;',
   error: 'color: white; background: #DC3545; padding: 1px 6px; border-radius: 4px;',
   "api:gateway": 'color: white; background: #007BFF; padding: 1px 6px; border-radius: 4px;',
   "api:voice": 'color: white; background: #029687; padding: 1px 6px; border-radius: 4px;',
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function log(section: LogSection, level: LogLevel, ...args: any[]): void {
   if (!enabledSections.has(section) || !enabledLevels.has(level)) {
      return;
   }

   const sectionStyle = sectionStyles[section] ?? sectionStyles.default;
   const levelStyle = levelStyles[level] ?? levelStyles.default;

   const formatString = `%c${section}%c [${level}]`;
   const stylesString = [sectionStyle, levelStyle];

   console.log(formatString, ...stylesString, ...args);
}

// biome-ignore lint/suspicious/noExplicitAny: <explanation>
export function error(section: LogSection, ...args: any[]): void {
   const levelStyle = levelStyles.default;
   const sectionStyle = sectionStyles[section] ?? sectionStyles.error;

   const formatString = `%c${section}%c [error]`;

   console.error(formatString, sectionStyle, levelStyle, ...args)
}
