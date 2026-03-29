import { UserFlags, type APIBadge, type BadgeType, type UserSettings } from ".";

export const CONSTANTS = {
   USERNAME_MIN_LENGTH: 4,
   USERNAME_MAX_LENGTH: 20,
   DISPLAY_NAME_MIN_LENGTH: 1,
   DISPLAY_NAME_MAX_LENGTH: 32,
   PASSWORD_MIN_LENGTH: 4,
   OAUTH_TOKEN_EXPIRE_TIME: "5mins",
   ACCESS_TOKEN_EXPIRE_TIME: "7d",
   REFRESH_TOKEN_EXPIRE_TIME: "14d",
   VOICE_TOKEN_EXPIRE_TIME: "1h",
   CDN_TOKEN_EXPIRE_TIME: "10mins",
   CDN_HMAC_EXPIRE_TIME: 86400,
   EMAIL_REGEX:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ as RegExp,
   USERNAME_REGEX: /^[a-zA-Z0-9_.]*$/ as RegExp,
   HEARTBEAT_INTERVAL: 40000,
   HEARTBEAT_TOLERANCE: 15000,
   ALLOWED_IMAGE_SIZES: [16, 32, 64, 128, 256, 512, 1_024, 2_048, 4_096] as const,
   ALLOWED_IMAGE_FORMATS: ["webp", "png", "jpg", "jpeg", "gif"] as const,
   ALLOWED_VIDEO_FORMATS: ["gifv", "mp4", "webm"] as const,
   CHANNEL_NAME_MAX_LENGTH: 100,
   ATTACHMENT_MEDIA_MAX_WIDTH: 550,
   ATTACHMENT_MEDIA_MAX_HEIGHT: 350,
   EMBED_MEDIA_MAX_WIDTH: 400,
   EMBED_MEDIA_MAX_HEIGHT: 300,
   VOICE_CLIENT_PING_INTERVAL: 2000,
   CALL_RINGING_TIMEOUT: 10000,
   KNOWN_APPLICATION_SIMILARITY_THRESHOLD: 90,
   MAX_VIDEO_BITRATE: 4000000,
   MIN_VIDEO_BITRATE: 400000,
   DEFAULT_VIDEO_BITRATE: 3000000,
   MAX_AUDIO_BITRATE: 1000000,
   MIN_AUDIO_BITRATE: 10000,
   DEFAULT_AUDIO_BITRATE: 100000,
   OAUTH_SENSITIVE_REAUTH_WINDOW: (60 * 60 * 1000) as number, // 1 hour
   EMAIL_VERIFICATION_WINDOW: (10 * 60 * 1000) as number, // 10 minutes
   EMAIL_VERIFICATION_RESEND_COOLDOWN: (30 * 1000) as number, // 30 seconds
   AVATAR_MAX_FILE_SIZE: (8 * 1024 * 1024) as number, // 8MB
   // OAUTH_SENSITIVE_REAUTH_WINDOW: 1000, // 1 second
};

export const DEFAULT_SERVER_SETTINGS: UserSettings = {
   status: "online",
   theme: undefined,
};

export const FLAG_BADGE_MAP: { [key in UserFlags]?: BadgeType } = {
   [UserFlags.STAFF]: "staff",
   [UserFlags.BUG_HUNTER]: "bug_hunter",
   [UserFlags.EARLY_HUGINN_SUPPORTER]: "early_supporter",
};

export const BADGES: readonly APIBadge[] = [
   { id: "staff", color: "#5865F2", description: "Huginn Staff", icon: "" },
   { id: "bug_hunter", color: "#F04747", description: "Bug Hunter", icon: "" },
   { id: "early_supporter", color: "#FAA61A", description: "Early Huginn Supporter", icon: "" },
];
