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
| Voice gateway | `wss://midgard.huginn.dev/voice`         |
| Voice HTTP API | `https://midgard.huginn.dev/voice`       |

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
   api: string;
   createSocket(url: string): WebSocket;
   transportOptions?: TransportOptions;
};

type TransportOptions = {
   deviceOptions?: DeviceOptions;
   iceTransportPolicy?: RTCIceTransportPolicy;
   voiceApi: string;
};
```

`url` selects the signaling WebSocket. `api` selects the voice HTTP API; use a base URL without a trailing slash because the SDK appends `/ice-servers`. Set both when targeting another instance.

`deviceOptions` is passed to the mediasoup client `Device` constructor. `iceTransportPolicy` defaults to `"all"`; use `"relay"` to require TURN. The current `TransportOptions` type requires `voiceApi`, but credential requests use the top-level `voice.api`. When supplying transport options, set both API fields to the same base URL.

### ICE servers and TURN

Before creating each send or receive transport, the SDK requests `GET /voice/ice-servers` relative to the configured voice HTTP API base. It uses global `fetch` with `Authorization: Bearer <access token>` and a ten-second timeout. The request uses the main access token, not a voice token, and bypasses `rest.makeRequest`.

The endpoint returns `{ iceServers: RTCIceServer[] }`. The voice service returns an empty array when `CLOUDFLARE_TURN_ID` or `CLOUDFLARE_TURN_TOKEN` is unset. With both configured, it requests Cloudflare credentials with a one-day TTL; provider HTTP failures or invalid responses return HTTP 500.

With policy `"all"`, a credential request failure allows transport creation to continue without the fetched ICE servers. With policy `"relay"`, the following errors reject transport setup and `connectVoice()`:

| `VoiceTransportErrorCode` | Value | Cause |
| --- | --- | --- |
| `RELAY_NOT_CONFIGURED` | `5005` | The response contains no `turn:` or `turns:` server URL. |
| `RELAY_CREDENTIALS_UNAVAILABLE` | `5006` | The credential request fails or times out. |

For example, to require TURN:

```ts
const voiceApi = "https://huginn.example/voice";
const client = new HuginnClient({
   voice: {
      url: "wss://huginn.example/voice",
      api: voiceApi,
      transportOptions: {
         voiceApi,
         iceTransportPolicy: "relay",
      },
   },
});
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
      url: "wss://huginn.example/voice",
      api: "https://huginn.example/voice",
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
   code: number;
   constructor(message: string, code: number);
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

`@huginnjs/api` re-exports:

- `HuginnClient`, `InitializationStatus`, and `InitializationResult`;
- `Voice`;
- `Gateway` and `AuthenticationStatus`;
- the configuration, voice, and `TransportError` types in this page.

Other manager classes are reachable through a client instance but are not currently re-exported from the package root.
