import { EventEmitter } from "@huginnjs/shared";

import type { VoiceEvents, VoiceMessage, VoiceMessages, VoiceRequest, VoiceResults } from "./voice-protocol";

type VoiceMessageWithoutData = {
   [K in keyof VoiceMessages]: VoiceMessages[K] extends undefined ? K : never;
}[keyof VoiceMessages];

type PendingRequest = {
   type: keyof VoiceResults;
   resolve: (result: VoiceResults[keyof VoiceResults]) => void;
   reject: (error: Error) => void;
   timeout: ReturnType<typeof setTimeout>;
};

const REQUEST_TIMEOUT_MS = 15000;

export class VoiceClient {
   private static channel?: BroadcastChannel;
   private static hostId?: string;
   private static pendingRequests = new Map<string, PendingRequest>();
   private static events = new EventEmitter<VoiceEvents>();

   public static configure(hostId: string): void {
      if (this.hostId === hostId && this.channel) return;

      this.dispose(new Error("Voice host changed"));
      this.hostId = hostId;
      this.channel = new BroadcastChannel(`voice:${hostId}`);
      this.channel.addEventListener("message", (event: MessageEvent<VoiceMessage>) => this.handleMessage(event.data));
   }

   public static getHostId(): string | undefined {
      return this.hostId;
   }

   public static listen<K extends keyof VoiceEvents>(type: K, listener: (data: VoiceEvents[K]) => void): () => void {
      return this.events.listen(type, listener);
   }

   public static sendMessage<K extends VoiceMessageWithoutData>(type: K): Promise<VoiceResults[K]>;
   public static sendMessage<K extends keyof VoiceMessages>(type: K, data: VoiceMessages[K]): Promise<VoiceResults[K]>;
   public static sendMessage(type: keyof VoiceMessages, data?: VoiceMessages[keyof VoiceMessages]): Promise<VoiceResults[keyof VoiceResults]> {
      if (!this.channel || !this.hostId) {
         return Promise.reject(new Error("Voice client is not connected to a host"));
      }

      const requestId = crypto.randomUUID();
      const message = { kind: "request", hostId: this.hostId, requestId, type, data } as VoiceRequest;

      return new Promise((resolve, reject) => {
         const timeout = setTimeout(() => {
            this.pendingRequests.delete(requestId);
            reject(new Error(`Voice request '${type}' timed out`));
         }, REQUEST_TIMEOUT_MS);

         this.pendingRequests.set(requestId, { type, resolve, reject, timeout });

         try {
            this.channel?.postMessage(message);
         } catch (error) {
            clearTimeout(timeout);
            this.pendingRequests.delete(requestId);
            reject(error instanceof Error ? error : new Error(String(error)));
         }
      });
   }

   public static dispose(error = new Error("Voice client was disposed")): void {
      this.channel?.close();
      this.channel = undefined;

      for (const request of this.pendingRequests.values()) {
         clearTimeout(request.timeout);
         request.reject(error);
      }
      this.pendingRequests.clear();
   }

   private static handleMessage(message: VoiceMessage): void {
      if (!this.hostId || message.hostId !== this.hostId) return;

      if (message.kind === "event") {
         this.events.emit(message.type, message.data);
         return;
      }

      if (message.kind !== "result") return;

      const pendingRequest = this.pendingRequests.get(message.requestId);
      if (!pendingRequest || pendingRequest.type !== message.type) return;

      clearTimeout(pendingRequest.timeout);
      this.pendingRequests.delete(message.requestId);

      if ("error" in message) {
         pendingRequest.reject(new Error(message.error));
      } else {
         pendingRequest.resolve(message.result);
      }
   }
}
