export const constants = {
	USERNAME_MIN_LENGTH: 4,
	USERNAME_MAX_LENGTH: 20,
	DISPLAY_NAME_MIN_LENGTH: 1,
	DISPLAY_NAME_MAX_LENGTH: 32,
	PASSWORD_MIN_LENGTH: 4,
	ACCESS_TOKEN_EXPIRE_TIME: "1d",
	REFRESH_TOKEN_EXPIRE_TIME: "7d",
	EMAIL_REGEX:
		/^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/ satisfies RegExp as RegExp,
	HEARTBEAT_INTERVAL: 10000,
	ALLOWED_IMAGE_SIZES: [16, 32, 64, 128, 256, 512, 1_024, 2_048, 4_096] as const,
	ALLOWED_IMAGE_FORMATS: ["webp", "png", "jpg", "jpeg", "gif"] as const,
	CHANNEL_NAME_MAX_LENGTH: 20,
};
