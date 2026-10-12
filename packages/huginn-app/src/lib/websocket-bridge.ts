export class WebSocketBridge extends EventTarget implements WebSocket {
   public static readonly CONNECTING = 0;
   public static readonly OPEN = 1;
   public static readonly CLOSING = 2;
   public static readonly CLOSED = 3;

   public readonly CONNECTING = WebSocketBridge.CONNECTING;
   public readonly OPEN = WebSocketBridge.OPEN;
   public readonly CLOSING = WebSocketBridge.CLOSING;
   public readonly CLOSED = WebSocketBridge.CLOSED;

   private static nextId = 0;
   private readonly name: string;
   private readonly unlisten: Array<() => void> = [];
   private _readyState: 0 | 1 | 2 | 3 = WebSocketBridge.CONNECTING;

   public binaryType: BinaryType = "blob";
   public readonly bufferedAmount = 0;
   public readonly extensions = "";
   public readonly protocol = "";
   public onopen: ((this: WebSocket, ev: Event) => any) | null = null;
   public onclose: ((this: WebSocket, ev: CloseEvent) => any) | null = null;
   public onerror: ((this: WebSocket, ev: Event) => any) | null = null;
   public onmessage: ((this: WebSocket, ev: MessageEvent) => any) | null = null;

   public get readyState(): 0 | 1 | 2 | 3 {
      return this._readyState;
   }

   public constructor(
      name: string,
      public readonly url: string,
   ) {
      super();
      this.name = `${name}:${WebSocketBridge.nextId++}`;

      this.addEventListener("open", (event) => this.onopen?.call(this, event));
      this.addEventListener("close", (event) => this.onclose?.call(this, event as CloseEvent));
      this.addEventListener("error", (event) => this.onerror?.call(this, event));
      this.addEventListener("message", (event) => this.onmessage?.call(this, event as MessageEvent));

      this.unlisten.push(
         window.electronAPI.onWebSocketOpen(this.name, () => {
            if (this._readyState !== WebSocketBridge.CONNECTING) return;
            this._readyState = WebSocketBridge.OPEN;
            this.dispatchEvent(new Event("open"));
         }),
         window.electronAPI.onWebSocketClose(this.name, (_event, code, reason, wasClean) => {
            if (this._readyState === WebSocketBridge.CLOSED) return;
            this._readyState = WebSocketBridge.CLOSED;
            const event = new CloseEvent("close", { code, reason, wasClean });
            this.dispatchEvent(event);
            for (const unlisten of this.unlisten) unlisten();
         }),
         window.electronAPI.onWebSocketError(this.name, (_event, message, details) => {
            this.dispatchEvent(new ErrorEvent("error", { message, error: details }));
         }),
         window.electronAPI.onWebSocketMessage(this.name, (_event, data) => {
            const message = data instanceof ArrayBuffer && this.binaryType === "blob" ? new Blob([data]) : data;
            this.dispatchEvent(new MessageEvent("message", { data: message }));
         }),
      );

      window.electronAPI.connectWebSocket(this.name, this.url);
   }

   public send(data: string | ArrayBufferLike | Blob | ArrayBufferView): void {
      if (this._readyState === WebSocketBridge.CONNECTING) {
         throw new DOMException("WebSocket is still connecting", "InvalidStateError");
      }
      if (this._readyState !== WebSocketBridge.OPEN) return;
      window.electronAPI.websocketSend(this.name, data);
   }

   public close(code?: number, reason?: string): void {
      if (code !== undefined && code !== 1000 && (code < 3000 || code > 4999)) {
         throw new DOMException("Invalid WebSocket close code", "InvalidAccessError");
      }
      if (reason && new TextEncoder().encode(reason).byteLength > 123) {
         throw new DOMException("WebSocket close reason is too long", "SyntaxError");
      }
      if (this._readyState === WebSocketBridge.CLOSING || this._readyState === WebSocketBridge.CLOSED) return;
      this._readyState = WebSocketBridge.CLOSING;
      window.electronAPI.disconnectWebSocket(this.name, code, reason);
   }
}
