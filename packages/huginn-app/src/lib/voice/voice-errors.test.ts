import { TransportError } from "@huginnjs/api";
import { VoiceTransportErrorCode } from "@huginnjs/shared";
import { describe, expect, it } from "vitest";

import { getVoiceConnectionErrorMessage } from "./voice-errors";

describe("voice connection errors", () => {
   it.each([
      [VoiceTransportErrorCode.RELAY_NOT_CONFIGURED, "This instance has no TURN relay configured."],
      [VoiceTransportErrorCode.RELAY_CREDENTIALS_UNAVAILABLE, "Could not get relay credentials."],
      [VoiceTransportErrorCode.DEVICE_NOT_INITIALIZED, "Device unavailable"],
   ])("shows the transport's explanation for error %s", (code, message) => {
      expect(getVoiceConnectionErrorMessage(new TransportError(message, code))).toBe(message);
   });

   it.each([new Error("network failure"), null, undefined, "unknown error"])("provides recovery advice for an unknown failure: %s", (error) => {
      expect(getVoiceConnectionErrorMessage(error)).toBe("Make sure you have an internet connection and try again.");
   });
});
