import { JsonCode } from "@huginnjs/shared";

export const ErrorMessages = {
   connectionLostError() {
      return {
         title: "Connection Error",
         text: "The server rests in the grip of frost; connection lost to the icy domain.",
         errorCode: "connection_lost",
      };
   },
   serverError() {
      return {
         title: "Server Error",
         text: "The server's thought processes falter; Huginn encounters a malfunction.",
         errorCode: "server_error",
      };
   },
   appError() {
      return {
         title: "App Failure",
         text: "A raven brings ill news: our app has encountered a fearsome error.",
         errorCode: "app_error",
      };
   },
};

export const APIMessages: Record<number, string> = {
   [JsonCode.USERNAME_NOT_FOUND]: "Hmm, no user with that username was found!",
   [JsonCode.RELATION_SELF_REQUEST]: "Hmm, you are trying to send a friend request to yourself!",
   [JsonCode.KNOWN_APPLICATION_EXISTS]: "The application you are trying to submit is already verified!",
};
