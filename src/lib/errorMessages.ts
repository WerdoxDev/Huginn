import { JsonCode } from "@shared/errors";

export const Messages = {
   frostHoldError() {
      return "The server rests in the grip of frost; connection lost to the icy domain. (FrostHold)";
   },
   huginnMalfunctionError() {
      return "The server's thought processes falter; Huginn encounters a malfunction. (HuginnMalfunction)";
   },
};

export const APIMessages = {
   [JsonCode.USERNAME_NOT_FOUND]: "Hmm, no user with that username was found!",
   [JsonCode.RELATION_SELF_REQUEST]: "Hmm, you are trying to send a friend request to yourself!",
};
