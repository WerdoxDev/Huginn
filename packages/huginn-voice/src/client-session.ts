import { CommonClientSession } from "@huginn/backend-shared";
import type { VoicePayload } from "@huginn/shared";
import type { ClientSessionProperties } from "#utils/types";

export class ClientSession extends CommonClientSession<VoicePayload, ClientSessionProperties> {
   public subscribeToTopicsExtra(): Promise<void> | void {

   }
}
