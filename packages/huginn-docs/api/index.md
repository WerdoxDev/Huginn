---
title: Getting started
description: Install and initialize the Huginn TypeScript client.
outline: deep
---

# Work with the Huginn API

`@huginnjs/api` is the typed client for Huginn's HTTP API, realtime gateway, CDN, and WebRTC voice stack. This page is the documentation entry point.

## Explore the API

- **[Authenticate a session](/api/guide/authentication)** — Log in, restore tokens, initialize the gateway, and handle session expiry.
- **[Call the REST API](/api/reference/rest-apis)** — Users, channels, messages, relationships, GIFs, OAuth, and applications.
- **[React to live events](/api/guide/gateway-events)** — Messages, presence, relationships, calls, settings, and resumable sessions.
- **[Add voice and media](/api/guide/voice)** — Calls, voice gateway, devices and mediasoup client.

## Install

Add the API package

::: code-group

```sh [pnpm]
pnpm add @huginnjs/api
```

```sh [bun]
bun add @huginnjs/api
```

```sh [npm]
npm install @huginnjs/api
```

:::

## Create a client

The defaults connect to `midgard.huginn.dev`. Instantiate one client and keep it for the lifetime of application.

```ts
import { HuginnClient } from "@huginnjs/api";

const client = new HuginnClient();
```

Use [`ClientOptions`](/api/reference/configuration#clientoptions) to point at another Huginn deployment or provide platform-specific `fetch` and `WebSocket` implementations.

## Initialize

`initialize()` connects and authenticates the gateway, and sets `currentUser`.

```ts
const result = await client.initialize({
   tokens: {
      token: accessToken,
      refreshToken: refreshToken,
   },
});

if (!result.success) {
   console.error(result.status, { retryable: result.retryable });
}
```

For more ways to authenticate check out [Authentication](/api/guide/authentication.md).

::: tip
`initialize()` refreshes an expired access token when a refresh token is available. Persist the tokens from `client.tokenHandler` only in storage appropriate for your runtime and threat model.
:::

## Make a typed request

API namespaces are available directly on the client:

```ts
const me = await client.users.getCurrent();
const channels = await client.channels.getAll();
const trending = await client.gifs.getTrending(24, 1);
```

See the [REST API reference](/api/reference/rest-apis) for every namespace and method.

## Listen for realtime updates

All gateway event payloads are typed:

```ts
const unlisten = client.gateway.listen("message_create", (message) => {
   console.log(message.id, message.content);
});

// Later:
unlisten();
```

See [Gateway & events](/api/guide/gateway-events) for more infos and the complete event catalog.

## Connect voice

After the gateway is authenticated, connect to a DM call with `guildId: null`:

```ts
await client.voiceManager.connectVoice(null, channelId);

const microphone = await navigator.mediaDevices.getUserMedia({ audio: true });
await client.voice.device.openMicrophone(microphone.getAudioTracks()[0]);
```

The [voice guide](/api/guide/voice) covers state, devices, screen sharing, and remote media.

## Shut down

`logout()` requests server-side logout, clears both tokens and `currentUser`, closes voice signaling, and intentionally closes the gateway:

```ts
await client.logout();
```

Use `clearSession()` only when you want to clear local authentication without closing active connections.

## Where to go next

- [Authentication](/api/guide/authentication) explains login, registration, refresh, and recovery outcomes.
- [HuginnClient reference](/api/reference/client) lists the root client properties and methods.
- [Configuration & types](/api/reference/configuration) covers endpoints, adapters, voice options, statuses, and `TransportError`.
