---
title: Configuration & types
description: Configure API, CDN, gateway, and voice adapters.
outline: deep
---

# Configuration & types

Pass partial configuration to `HuginnClient`. Missing values use the production defaults.

## ClientOptions

```ts
type ClientOptions<V extends Voice = Voice> = {
   rest?: Partial<RESTOptions>;
   cdn?: Partial<CDNOptions>;
   gateway?: Partial<GatewayOptions>;
   voice?: Partial<VoiceOptions<V>>;
};
```

::: warning
Nested options are consumed by their individual clients and merged with defaults. Keep endpoint families aligned when targeting another deployment.
:::

## Default endpoints

| Feature       | Default                                  |
| ------------- | ---------------------------------------- |
| REST          | `https://midgard.huginn.dev/api`         |
| CDN           | `https://midgard.huginn.dev`             |
| Gateway       | `wss://midgard.huginn.dev/gateway`       |
| Voice gateway | `wss://midgard.huginn.dev/voice-gateway` |

## RESTOptions

```ts
type RESTOptions = {
   api: string;
   authPrefix: "Bearer";
   makeRequest(url: string, init: RequestInit): Promise<ResponseLike>;
};
```

The default adapter calls global `fetch` and converts its response to the shared `ResponseLike` interface.

```ts
const client = new HuginnClient({
   rest: {
      api: "https://huginn.example/api",
      makeRequest: async (url, init) => {
         const response = await fetch(url, init);
         return toResponseLike(response);
      },
   },
});
```

## CDNOptions

```ts
type CDNOptions = {
   url: string;
};
```

The URL is used as the origin for generated asset paths.

## GatewayOptions

```ts
type GatewayOptions = {
   url: string;
   intents: number;
   properties: GatewayIdentifyProperties;
   createSocket(url: string): WebSocket;
};
```

Default identify properties are:

```ts
{
  os: "unknown",
  browser: "unknown",
  device: "unknown",
}
```

The source reserves `intents`, but intent filtering is not implemented yet.

## VoiceOptions

```ts
type VoiceOptions<V extends Voice = Voice> = {
   class: VoiceConstructor<V>;
   url: string;
   createSocket(url: string): WebSocket;
};
```

Use `class` to extend voice behavior while preserving the client type:

```ts
class DesktopVoice extends Voice {
   // Runtime-specific integration
}

const client = new HuginnClient<DesktopVoice>({
   voice: {
      class: DesktopVoice,
      createSocket: (url) => new WebSocket(url),
   },
});
```

## Complete custom deployment

```ts
const client = new HuginnClient({
   rest: {
      api: "https://huginn.example/api",
   },
   cdn: {
      url: "https://huginn.example",
   },
   gateway: {
      url: "wss://huginn.example/gateway",
      intents: 0,
      properties: {
         os: navigator.platform,
         browser: "my-client",
         device: "desktop",
      },
      createSocket: (url) => new WebSocket(url),
   },
   voice: {
      url: "wss://huginn.example/voice-gateway",
      createSocket: (url) => new WebSocket(url),
   },
});
```

## Voice types

### `VoiceConnectionData`

```ts
type VoiceConnectionData = {
   token: string;
   channelId: Snowflake;
   guildId: Snowflake | null;
};
```

### `VoiceStreamOptions`

```ts
type VoiceStreamOptions = {
   useSimulcast?: boolean;
   maxVideoBitrate?: number;
   maxAudioBitrate?: number;
};
```

### Status and reset types

```ts
type VoiceStatus = "idle" | "connecting" | "signaling" | "disconnected" | "ready";

type VoiceSignallingResetType = "hard" | "soft" | "session";
```

## TransportError

```ts
class TransportError extends Error {
   code?: number;
}
```

Transport assertion helpers throw `TransportError` when the mediasoup device or required transport is not available.

```ts
try {
   client.voice.transport.checkSendTransport();
} catch (error) {
   if (error instanceof TransportError) {
      console.error(error.message, error.code);
   }
}
```

## Exported package surface

`@huginn/api` re-exports:

- `HuginnClient`, `InitializationStatus`, and `InitializationResult`;
- `Voice`;
- `Gateway` and `AuthenticationStatus`;
- the configuration, voice, and `TransportError` types in this page.

Other manager classes are reachable through a client instance but are not currently re-exported from the package root.
