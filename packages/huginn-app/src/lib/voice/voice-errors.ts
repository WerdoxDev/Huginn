import { TransportError } from "@huginnjs/api";

export function getVoiceConnectionErrorMessage(error: unknown): string {
   if (error instanceof TransportError) {
      // if (error.code === TransportErrorCode.RELAY_NOT_CONFIGURED || error.code === TransportErrorCode.RELAY_CREDENTIALS_UNAVAILABLE) {
      return error.message;
      // }
   }

   return "Make sure you have an internet connection and try again.";
}
