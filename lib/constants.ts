export const constants = {
   USERNAME_MIN_LENGTH: 4,
   USERNAME_MAX_LENGTH: 20,
   DISPLAY_NAME_MIN_LENGTH: 1,
   DISPLAY_NAME_MAX_LENGTH: 32,
   PASSWORD_MIN_LENGTH: 4,
   ACCESS_TOKEN_EXPIRE_TIME: "10s",
   REFRESH_TOKEN_EXPIRE_TIME: "7d",
   EMAIL_REGEX:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};
