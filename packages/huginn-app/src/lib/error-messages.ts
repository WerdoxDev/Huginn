import { JsonCode } from "@huginn/shared";

export const Messages = {
   connectionLostError() {
      return {
         title: "Connection Error",
         text: "The server rests in the grip of frost; connection lost to the icy domain. (FrostHold)",
      };
   },
   serverError() {
      return {
         title: "Server Error",
         text: "The server's thought processes falter; Huginn encounters a malfunction. (HuginnMalfunction)",
      };
   },
   appError() {
      return { title: "App Failure", text: "A raven brings ill news: our app has encountered a fearsome error. (OdinBeard)" };
   },
};

export const APIMessages = {
   [JsonCode.USERNAME_NOT_FOUND]: "Hmm, no user with that username was found!",
   [JsonCode.RELATION_SELF_REQUEST]: "Hmm, you are trying to send a friend request to yourself!",
};
