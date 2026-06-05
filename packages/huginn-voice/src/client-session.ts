import type { Peer } from "crossws";

import { CommonClientSession } from "@huginn/backend-shared";
import { WorkerID, type Snowflake, type VoicePayload } from "@huginn/shared";

import type { ClientSessionProperties } from "#utils/types";

export class ClientSession extends CommonClientSession<VoicePayload, ClientSessionProperties> {
   public constructor(peer: Peer, sessionId: Snowflake) {
      super(peer, sessionId, WorkerID.VOICE);
   }
   // public send(data: VoicePayload) {
   //    if (data.op === VoiceOperations.DISPATCH) {
   //       data.s = this.getIncreasedSequence();
   //    }
   //    this.peer.send(JSON.stringify(data));
   // }
}
