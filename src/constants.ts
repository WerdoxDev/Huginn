export const constants = {
   USERNAME_MIN_LENGTH: 4,
   USERNAME_MAX_LENGTH: 15,
   DISPLAY_NAME_MIN_LENGTH: 1,
   DISPLAY_NAME_MAX_LENGTH: 32,
   PASSWORD_MIN_LENGTH: 4,
   EMAIL_REGEX:
      /^(([^<>()[\]\\.,;:\s@"]+(\.[^<>()[\]\\.,;:\s@"]+)*)|.(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
};

export const DefaultResponseInit = {
   headers: { "Content-Type": "application/json" },
};
