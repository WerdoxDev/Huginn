import { TransportError } from "@huginnjs/api";
import { TransportErrorCode } from "@huginnjs/shared";
import { describe, expect, it } from "vitest";

import { getVoiceConnectionErrorMessage } from "./voice-errors";

describe("getVoiceConnectionErrorMessage", () => {
   it("shows relay errors using their numeric codes", () => {
      const notConfigured = new TransportError("This instance has no TURN relay configured.", TransportErrorCode.RELAY_NOT_CONFIGURED);
      const credentialsUnavailable = {
         name: "TransportError",
         code: TransportErrorCode.RELAY_CREDENTIALS_UNAVAILABLE,
         message: "Could not get relay credentials.",
      };

      expect(getVoiceConnectionErrorMessage(notConfigured)).toBe(notConfigured.message);
      expect(getVoiceConnectionErrorMessage(credentialsUnavailable)).toBe(credentialsUnavailable.message);
   });

   it("uses the default message for other errors", () => {
      const fallback = "Make sure you have an internet connection and try again.";
      expect(getVoiceConnectionErrorMessage(new TransportError("Device unavailable", TransportErrorCode.DEVICE_NOT_INITIALIZED))).toBe(fallback);
      expect(getVoiceConnectionErrorMessage(new Error("This instance has no TURN relay configured."))).toBe(fallback);
   });
});
