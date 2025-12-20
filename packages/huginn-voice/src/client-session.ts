import { CommonClientSession } from "@huginn/backend-shared";
import { VoiceOperations, type VoicePayload } from "@huginn/shared";
import type { ClientSessionProperties } from "#utils/types";

export class ClientSession extends CommonClientSession<VoicePayload, ClientSessionProperties> {
   public subscribeToTopicsExtra(): Promise<void> | void {}

   // public send(data: VoicePayload) {
   //    if (data.op === VoiceOperations.DISPATCH) {
   //       data.s = this.getIncreasedSequence();
   //    }

   //    this.peer.send(JSON.stringify(data));
   // }
}
