---
title: HuginnClient
description: Root client properties, lifecycle methods, and namespaces.
---

# HuginnClient

`HuginnClient` composes all transport and feature clients into one typed entry point.

```ts
import { HuginnClient } from "@huginn/api";

const client = new HuginnClient(options);
```

## Constructor

```ts
new HuginnClient<V extends Voice = Voice>(
  options?: Partial<ClientOptions<V>>,
)
```

User options are merged with the defaults. A custom `Voice` subclass can be supplied through `options.voice.class`.

## Core properties

| Property | Type | Description |
| --- | --- | --- |
| `options` | `ClientOptions<V>` | Resolved client configuration. |
| `currentUser` | `APIUser \| undefined` | Authenticated gateway user. |
| `rest` | `REST` | Low-level HTTP request client. |
| `cdn` | `CDN` | CDN URL builder. |
| `tokenHandler` | `TokenHandler` | Access and refresh token state. |
| `gateway` | `Gateway` | Realtime WebSocket client. |
| `voice` | `V` | Voice signaling and media facade. |
| `voiceManager` | `VoiceManager<V>` | Voice connection and state coordinator. |

## REST namespaces

| Property | Feature |
| --- | --- |
| `auth` | Login, registration, logout, refresh, notification tokens. |
| `users` | Users, profiles, current user, settings, email verification. |
| `channels` | DMs, recipients, messages, pins, typing, acknowledgements, calls. |
| `messages` | Message reactions. |
| `relationships` | Fetch, create, and remove relationships. |
| `applications` | Known applications and application icons. |
| `gifs` | Categories, trending GIFs, and search. |
| `common` | Unique usernames and changelog. |
| `oauth` | OAuth confirmation and authorization URL generation. |

## Methods

### `connect()`

```ts
connect(): Promise<boolean>
```

Connects the gateway only. It resolves `true` after gateway hello and `false` if the socket disconnects or resets first.

### `initialize()`

```ts
initialize(options?: {
  tokens?: Partial<Tokens>;
}): Promise<InitializationResult>
```

Restores supplied tokens, refreshes an expired access token when possible, connects and authenticates the gateway, and assigns `currentUser`.

```ts
const result = await client.initialize({ tokens });
```

### `validateAccessToken()`

```ts
validateAccessToken(token?: string): Promise<boolean>
```

Checks JWT parsing and expiry. Assigns a valid token to `tokenHandler.token`.

### `clearSession()`

```ts
clearSession(): void
```

Clears the access token, refresh token, and current user. Connections remain open.

### `login()`

```ts
login(credentials: LoginCredentials): Promise<APIPostLoginResult>
```

Performs login and stores returned tokens.

### `register()`

```ts
register(user: RegisterUser): Promise<APIPostRegisterResult>
```

Registers a user without automatically starting a session.

### `logout()`

```ts
logout(): Promise<void>
```

Requests logout, then always clears session state and closes voice signaling and the gateway.

### `generateNonce()`

```ts
generateNonce(): Snowflake
```

Generates a string snowflake using the API worker ID. Use it where an optimistic client nonce is required.

### `checkUser()`

```ts
checkUser(): asserts this is this & { currentUser: APIUser }
```

Narrows `currentUser` for TypeScript or throws if no authenticated user exists.

## Initialization types

```ts
type InitializationStatus =
  | "success"
  | "timeout"
  | "network_error"
  | "invalid_tokens"
  | "authentication_failed"
  | "not_connected";

type InitializationResult = {
  success: boolean;
  status: InitializationStatus;
  retryable: boolean;
};
```

## TokenHandler

`client.tokenHandler` is constructed with the client:

| Member | Signature |
| --- | --- |
| `token` | `get/set string \| undefined` |
| `refreshToken` | `get/set string \| undefined` |
| `waitForTokenRefresh()` | `Promise<boolean>` |

Setting a decodable, unexpired JWT schedules a token refresh one second before its `exp` time.
